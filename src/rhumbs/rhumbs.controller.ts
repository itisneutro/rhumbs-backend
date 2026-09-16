import {
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Render,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CURRENT_USER_ID, RhumbsService } from './rhumbs.service';

// Пустое поле формы и нечисловой ввод дают null, а не 0: Number('') === 0.
function toNumberOrNull(raw: string): number | null {
  if (raw === undefined || raw.trim() === '') {
    return null;
  }

  const parsed = Number(raw);

  return Number.isNaN(parsed) ? null : parsed;
}

@Controller('rhumbs')
export class RhumbsController {
  constructor(private readonly rhumbs: RhumbsService) {}

  @Get()
  @Render('rhumbs-tiles')
  async tiles(@Query('minAzimuth') minAzimuth?: string) {
    const parsed = Number(minAzimuth);
    const threshold =
      minAzimuth === undefined || minAzimuth === '' || Number.isNaN(parsed)
        ? 0
        : parsed;

    const rhumbs = await this.rhumbs.findPublished(threshold);

    return { rhumbs, minAzimuth: threshold };
  }

  @Get('draft')
  @Render('rhumbs-draft')
  async draft() {
    const rhumb = await this.rhumbs.findDraftByUser(CURRENT_USER_ID);

    return { rhumb };
  }

  // Черновик создаётся только по названию — кнопкой «Далее».
  @Post('draft')
  async createDraft(
    @Body('name') name: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.rhumbs.createDraft(name);

    res.redirect(302, '/rhumbs/draft');
  }

  // Публикация дозаполняет название, описание и оба азимута.
  @Post(':id/publish')
  async publishDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('geographicAzimuthDeg') geographic: string,
    @Body('magneticAzimuthDeg') magnetic: string,
    @Res() res: Response,
  ): Promise<void> {
    const geographicDeg = toNumberOrNull(geographic);
    const magneticDeg = toNumberOrNull(magnetic);

    await this.rhumbs.publishDraft(
      id,
      name,
      description?.trim() ? description : null,
      geographicDeg,
      magneticDeg === null ? null : String(magneticDeg),
    );

    res.redirect(302, '/rhumbs');
  }

  // Логическое удаление с плитки — сырой SQL в сервисе, здесь только маршрут.
  @Post(':id/delete')
  async markDeleted(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ): Promise<void> {
    const deleted = await this.rhumbs.markDeleted(id);

    if (!deleted) {
      throw new NotFoundException('Румб не найден');
    }

    res.redirect(302, '/rhumbs');
  }

  @Get('feed/:id')
  async feed(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @Query('next') next?: string,
  ): Promise<void> {
    const rhumb =
      next === '1'
        ? await this.rhumbs.findNextPublished(id)
        : await this.rhumbs.findPublishedById(id);

    if (!rhumb) {
      res.status(HttpStatus.NOT_FOUND).render('rhumbs-missing');
      return;
    }

    const likesCount = await this.rhumbs.countLikes(rhumb.id);

    res.render('rhumbs-feed', { rhumb, likesCount });
  }
}
