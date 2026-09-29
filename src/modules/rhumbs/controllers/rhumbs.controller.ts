import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateRhumbsDto } from '../dto/create-rhumbs.dto';
import { LikeRhumbsDto } from '../dto/like-rhumbs.dto';
import { PublishRhumbsDto } from '../dto/publish-rhumbs.dto';
import { RhumbsResponseDto } from '../dto/rhumbs-response.dto';
import { RhumbsFeedQueryDto, RhumbsQueryDto } from '../dto/rhumbs-query.dto';
import { RhumbsService } from '../services/rhumbs.service';
import type { RhumbsFiles } from '../services/rhumbs.service';

const VIDEO_LIMIT = 50 * 1024 * 1024;

const uploads = FileFieldsInterceptor(
  [
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ],
  {
    storage: memoryStorage(),
    limits: { fileSize: VIDEO_LIMIT },
    fileFilter: (_request, file, callback) => {
      const isMp4 =
        file.mimetype === 'video/mp4' ||
        (file.mimetype === 'application/octet-stream' &&
          file.originalname.toLowerCase().endsWith('.mp4'));

      const allowed =
        file.fieldname === 'image'
          ? file.mimetype.startsWith('image/')
          : isMp4;

      callback(allowed ? null : new BadRequestException(), allowed);
    },
  },
);

@Controller('rhumbs')
export class RhumbsController {
  constructor(private readonly rhumbs: RhumbsService) {}

  @Get()
  async list(@Query() query: RhumbsQueryDto): Promise<RhumbsResponseDto[]> {
    return this.rhumbs.findPublished(query.minAzimuth);
  }

  @Get(['feed', 'feed/:id'])
  async feed(
    @Param('id', new ParseIntPipe({ optional: true })) id: number | undefined,
    @Query() query: RhumbsFeedQueryDto,
  ): Promise<RhumbsResponseDto> {
    return this.rhumbs.findFeed(id, query.next);
  }

  @Get('draft')
  async draft(): Promise<RhumbsResponseDto> {
    return this.rhumbs.findDraft();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(uploads)
  async create(
    @Body() payload: CreateRhumbsDto,
    @UploadedFiles() files: RhumbsFiles,
  ): Promise<RhumbsResponseDto> {
    return this.rhumbs.createDraft(payload.name, files ?? {});
  }

  @Put('draft/publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @Body() payload: PublishRhumbsDto,
  ): Promise<RhumbsResponseDto> {
    return this.rhumbs.publishDraft(payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.rhumbs.markDeleted(id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async like(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: LikeRhumbsDto,
  ): Promise<RhumbsResponseDto> {
    return this.rhumbs.setLike(id, payload.value);
  }
}
