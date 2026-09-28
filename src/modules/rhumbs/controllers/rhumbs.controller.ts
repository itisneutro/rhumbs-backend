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
import { CreateRhumbDto } from '../dto/create-rhumb.dto';
import { LikeRhumbDto } from '../dto/like-rhumb.dto';
import { PublishRhumbDto } from '../dto/publish-rhumb.dto';
import { RhumbResponseDto } from '../dto/rhumb-response.dto';
import { FeedQueryDto, RhumbsQueryDto } from '../dto/rhumbs-query.dto';
import { RhumbsService } from '../services/rhumbs.service';
import type { RhumbFiles } from '../services/rhumbs.service';

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
  async list(@Query() query: RhumbsQueryDto): Promise<RhumbResponseDto[]> {
    return this.rhumbs.findPublished(query.minAzimuth);
  }

  @Get('feed')
  async feedStart(): Promise<RhumbResponseDto> {
    return this.rhumbs.findFeedStart();
  }

  @Get('draft')
  async draft(): Promise<RhumbResponseDto> {
    return this.rhumbs.findDraft();
  }

  @Get('feed/:id')
  async feedItem(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FeedQueryDto,
  ): Promise<RhumbResponseDto> {
    return this.rhumbs.findFeedItem(id, query.next);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(uploads)
  async create(
    @Body() payload: CreateRhumbDto,
    @UploadedFiles() files: RhumbFiles,
  ): Promise<RhumbResponseDto> {
    return this.rhumbs.createDraft(payload.name, files ?? {});
  }

  @Put(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: PublishRhumbDto,
  ): Promise<RhumbResponseDto> {
    return this.rhumbs.publishDraft(id, payload);
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
    @Body() payload: LikeRhumbDto,
  ): Promise<RhumbResponseDto> {
    return this.rhumbs.setLike(id, payload.value);
  }
}
