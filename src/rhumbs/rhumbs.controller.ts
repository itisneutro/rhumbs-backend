import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Render,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CURRENT_USER_ID, RhumbsService } from './rhumbs.service';

function toNumberOrNull(raw: string): number | null {
  if (raw === undefined || raw.trim() === '') {
    return null;
  }

  const parsed = Number(raw);

  return Number.isNaN(parsed) ? null : parsed;
}

function toIdOrNull(raw: string): number | null {
  return /^\d+$/.test(raw) ? Number(raw) : null;
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

  @Post('draft')
  async createDraft(
    @Body('name') name: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.rhumbs.createDraft(name);

    res.redirect(302, '/rhumbs/draft');
  }

  @Post(':id/publish')
  async publishDraft(
    @Param('id') rawId: string,
    @Body('name') name: string,
    @Body('description') description: string,
    @Body('geographicAzimuthDeg') geographic: string,
    @Body('magneticAzimuthDeg') magnetic: string,
    @Res() res: Response,
  ): Promise<void> {
    const id = toIdOrNull(rawId);

    if (id === null) {
      res.status(HttpStatus.NOT_FOUND).end();
      return;
    }

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

  @Post(':id/delete')
  async markDeleted(
    @Param('id') rawId: string,
    @Res() res: Response,
  ): Promise<void> {
    const id = toIdOrNull(rawId);

    if (id === null) {
      res.status(HttpStatus.NOT_FOUND).end();
      return;
    }

    const deleted = await this.rhumbs.markDeleted(id);

    if (!deleted) {
      res.status(HttpStatus.NOT_FOUND).end();
      return;
    }

    res.redirect(302, '/rhumbs');
  }

  @Get('feed/:id')
  async feed(
    @Param('id') rawId: string,
    @Res() res: Response,
    @Query('next') next?: string,
  ): Promise<void> {
    const id = toIdOrNull(rawId);

    if (id === null) {
      res.status(HttpStatus.NOT_FOUND).render('rhumbs-missing');
      return;
    }

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
