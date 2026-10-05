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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { SessionUserId } from '../../../common/session-user.decorator';
import { SessionGuard } from '../../../common/session.guard';
import { SESSION_COOKIE } from '../../users/services/sessions.service';
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

@ApiTags('rhumbs')
@Controller('rhumbs')
export class RhumbsController {
  constructor(private readonly rhumbs: RhumbsService) {}

  @Get()
  @ApiOperation({
    summary: 'Список опубликованных румбов с фильтром по азимуту',
  })
  @ApiResponse({ status: 200, description: 'Массив румбов', type: [RhumbsResponseDto] })
  @ApiResponse({ status: 400, description: 'Неверный minAzimuth или лишний параметр' })
  async list(
    @SessionUserId() userId: number,
    @Query() query: RhumbsQueryDto,
  ): Promise<RhumbsResponseDto[]> {
    return this.rhumbs.findPublished(userId, query.minAzimuth);
  }

  @Get(['feed', 'feed/:id'])
  @ApiOperation({
    summary: 'Лента: первый опубликованный, румб по id или следующий по кругу',
  })
  @ApiResponse({ status: 200, description: 'Один румб', type: RhumbsResponseDto })
  @ApiResponse({ status: 400, description: 'Нечисловой id или неверный next' })
  @ApiResponse({ status: 404, description: 'Румб не найден или не опубликован' })
  async feed(
    @SessionUserId() userId: number,
    @Param('id', new ParseIntPipe({ optional: true })) id: number | undefined,
    @Query() query: RhumbsFeedQueryDto,
  ): Promise<RhumbsResponseDto> {
    return this.rhumbs.findFeed(userId, id, query.next);
  }

  @Get('draft')
  @UseGuards(SessionGuard)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({ summary: 'Черновик текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Черновик', type: RhumbsResponseDto })
  @ApiResponse({ status: 403, description: 'Вход не выполнен' })
  @ApiResponse({ status: 404, description: 'Черновика нет' })
  async draft(@SessionUserId() userId: number): Promise<RhumbsResponseDto> {
    return this.rhumbs.findDraft(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SessionGuard)
  @UseInterceptors(uploads)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', maxLength: 64, example: 'Северо-западный' },
        image: { type: 'string', format: 'binary' },
        video: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Создание черновика с картинкой и видео' })
  @ApiResponse({ status: 201, description: 'Черновик создан', type: RhumbsResponseDto })
  @ApiResponse({ status: 400, description: 'Черновик уже есть или данные неверны' })
  @ApiResponse({ status: 403, description: 'Вход не выполнен' })
  async create(
    @SessionUserId() userId: number,
    @Body() payload: CreateRhumbsDto,
    @UploadedFiles() files: RhumbsFiles,
  ): Promise<RhumbsResponseDto> {
    return this.rhumbs.createDraft(userId, payload.name, files ?? {});
  }

  @Put('draft/publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({ summary: 'Публикация черновика текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Румб опубликован', type: RhumbsResponseDto })
  @ApiResponse({ status: 400, description: 'Данные неверны' })
  @ApiResponse({ status: 403, description: 'Вход не выполнен' })
  @ApiResponse({ status: 404, description: 'Черновика нет' })
  async publish(
    @SessionUserId() userId: number,
    @Body() payload: PublishRhumbsDto,
  ): Promise<RhumbsResponseDto> {
    return this.rhumbs.publishDraft(userId, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({ summary: 'Мягкое удаление своего опубликованного румба' })
  @ApiResponse({ status: 200, description: 'Румб удалён' })
  @ApiResponse({ status: 400, description: 'Нечисловой id' })
  @ApiResponse({ status: 403, description: 'Вход не выполнен' })
  @ApiResponse({ status: 404, description: 'Румб не найден или чужой' })
  async remove(
    @SessionUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.rhumbs.markDeleted(userId, id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiOperation({
    summary: 'Лайк опубликованного румба: isLiked 1 ставит, 0 снимает',
  })
  @ApiResponse({ status: 200, description: 'Румб с новым likesCount', type: RhumbsResponseDto })
  @ApiResponse({ status: 400, description: 'Неверное значение или id' })
  @ApiResponse({ status: 403, description: 'Вход не выполнен' })
  @ApiResponse({ status: 404, description: 'Румб не найден или не опубликован' })
  async like(
    @SessionUserId() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: LikeRhumbsDto,
  ): Promise<RhumbsResponseDto> {
    return this.rhumbs.setLike(userId, id, payload.isLiked);
  }
}
