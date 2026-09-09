import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Render,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CURRENT_USER_ID, WindRhumbsService } from './wind-rhumbs.service';

// Пустое поле формы и нечисловой ввод дают null, а не 0: Number('') === 0.
function toNumberOrNull(raw: string): number | null {
  if (raw === undefined || raw.trim() === '') {
    return null;
  }

  const parsed = Number(raw);

  return Number.isNaN(parsed) ? null : parsed;
}

// Фото и видео по умолчанию отдаются с SSR-сервера из public/.
const DEFAULT_IMAGE_URL = '/wind-rhumb-default.jpg';
const DEFAULT_VIDEO_URL = '/wind-rhumb-default.mp4';

@Controller('rhumbs')
export class WindRhumbsController {
  constructor(private readonly windRhumbs: WindRhumbsService) {}

  @Get()
  @Render('wind-tiles')
  async tiles(@Query('minAzimuth') minAzimuth?: string) {
    const parsed = Number(minAzimuth);
    const threshold =
      minAzimuth === undefined || minAzimuth === '' || Number.isNaN(parsed)
        ? 0
        : parsed;

    const rhumbs = await this.windRhumbs.findPublished(threshold);

    return {
      rhumbs,
      minAzimuth: threshold,
      defaultImageUrl: DEFAULT_IMAGE_URL,
    };
  }

  @Get('draft')
  @Render('wind-draft')
  async draft() {
    const rhumb = await this.windRhumbs.findDraftByUser(CURRENT_USER_ID);

    return {
      rhumb,
      likesCount: rhumb?.likesCount ?? 0,
    };
  }

  // Черновик создаётся только по названию, фото и видео — кнопкой «Далее».
  @Post('draft')
  async createDraft(
    @Body('name') name: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.windRhumbs.createDraft(name);

    res.redirect(302, '/rhumbs/draft');
  }

  // Публикация дозаполняет описание и оба азимута — кнопкой «Опубликовать».
  @Post('publish')
  async publishDraft(
    @Body('description') description: string,
    @Body('rhumbGeographicAzimuthDeg') geographic: string,
    @Body('rhumbMagneticAzimuthDeg') magnetic: string,
    @Res() res: Response,
  ): Promise<void> {
    const geographicDeg = toNumberOrNull(geographic);
    const magneticDeg = toNumberOrNull(magnetic);

    await this.windRhumbs.publishDraft(
      description?.trim() ? description : null,
      geographicDeg,
      magneticDeg === null ? null : String(magneticDeg),
    );

    res.redirect(302, '/rhumbs');
  }

  // Логическое удаление с плитки — сырой SQL в сервисе, здесь только разбор формы.
  @Post('remove')
  async markDeleted(
    @Body('id') rawId: string,
    @Res() res: Response,
  ): Promise<void> {
    const id = toNumberOrNull(rawId);

    if (id !== null) {
      await this.windRhumbs.markDeleted(id);
    }

    res.redirect(302, '/rhumbs');
  }

  @Get('feed/:id')
  async feed(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Query('next') next?: string,
  ): Promise<void> {
    const targetId =
      next === 'true' ? await this.windRhumbs.findNextPublishedId(id) : id;

    const rhumb =
      targetId === null ? null : await this.windRhumbs.findPublishedById(targetId);

    if (!rhumb) {
      res.redirect('/rhumbs');
      return;
    }

    res.render('wind-feed', {
      rhumb,
      likesCount: rhumb.likesCount,
      defaultImageUrl: DEFAULT_IMAGE_URL,
      defaultVideoUrl: DEFAULT_VIDEO_URL,
    });
  }
}
