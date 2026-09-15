import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RhumbLike } from './entities/rhumb-like.entity';
import { WindRhumb, WindRhumbStatus } from './entities/wind-rhumb.entity';

// Авторизация появится в лабораторной 4, пока текущий пользователь фиксирован.
export const CURRENT_USER_ID = 4;

type WindRhumbWithLikes = WindRhumb & { likesCount: number };

@Injectable()
export class WindRhumbsService {
  constructor(
    @InjectRepository(WindRhumb)
    private readonly windRhumbs: Repository<WindRhumb>,
    @InjectRepository(RhumbLike)
    private readonly rhumbLikes: Repository<RhumbLike>,
  ) {}

  async findPublished(minAzimuth?: number): Promise<WindRhumbWithLikes[]> {
    const query = this.windRhumbs
      .createQueryBuilder('rhumb')
      .leftJoin(RhumbLike, 'rhumbLike', 'rhumbLike.rhumbId = rhumb.id')
      .addSelect('COUNT(rhumbLike.id)', 'likesCount')
      .where('rhumb.status = :status', { status: 'published' })
      .groupBy('rhumb.id')
      .orderBy('rhumb.rhumbGeographicAzimuthDeg', 'ASC');

    if (minAzimuth !== undefined && Number.isFinite(minAzimuth)) {
      query.andWhere('rhumb.rhumbGeographicAzimuthDeg >= :minAzimuth', {
        minAzimuth,
      });
    }

    const { entities, raw } = await query.getRawAndEntities<{
      likesCount: string;
    }>();

    return entities.map((rhumb, index) => ({
      ...rhumb,
      likesCount: Number(raw[index].likesCount),
    }));
  }

  async findPublishedById(id: number): Promise<WindRhumbWithLikes | null> {
    const rhumb = await this.windRhumbs.findOne({
      where: { id, status: 'published' },
    });

    return rhumb ? this.withLikesCount(rhumb) : null;
  }

  async findNextPublishedId(currentId: number): Promise<number | null> {
    const published = await this.windRhumbs.find({
      where: { status: 'published' },
      order: { rhumbGeographicAzimuthDeg: 'ASC' },
      select: { id: true },
    });

    if (published.length === 0) {
      return null;
    }

    const current = published.findIndex((rhumb) => rhumb.id === currentId);

    return published[(current + 1) % published.length].id;
  }

  async findDraftByUser(userId: number): Promise<WindRhumbWithLikes | null> {
    // Актуальным считается первый созданный черновик: без order выбор строки
    // непредсказуем, если черновиков у пользователя оказалось несколько.
    const rhumb = await this.windRhumbs.findOne({
      where: { status: 'draft', creatorId: userId },
      order: { id: 'ASC' },
    });

    return rhumb ? this.withLikesCount(rhumb) : null;
  }

  // Фото и видео в этой лабораторной на сервер не передаются и в БД
  // не сохраняются: оба адреса пишутся пустыми, вместо них показывается
  // файл по умолчанию с SSR-сервера.
  async createDraft(name: string): Promise<WindRhumb> {
    const existing = await this.findDraftByUser(CURRENT_USER_ID);

    if (existing) {
      return existing;
    }

    const draft = this.windRhumbs.create({
      name,
      imageUrl: null,
      videoUrl: null,
      status: 'draft',
      creatorId: CURRENT_USER_ID,
      description: null,
      rhumbGeographicAzimuthDeg: null,
      rhumbMagneticAzimuthDeg: null,
      formedAt: null,
    });

    return this.windRhumbs.save(draft);
  }

  async publishDraft(
    description: string | null,
    rhumbGeographicAzimuthDeg: number | null,
    rhumbMagneticAzimuthDeg: string | null,
  ): Promise<void> {
    const draft = await this.windRhumbs.findOne({
      where: { status: 'draft', creatorId: CURRENT_USER_ID },
    });

    if (!draft) {
      return;
    }

    draft.description = description;
    draft.rhumbGeographicAzimuthDeg = rhumbGeographicAzimuthDeg;
    draft.rhumbMagneticAzimuthDeg = rhumbMagneticAzimuthDeg;
    draft.status = 'published';
    draft.formedAt = new Date();

    await this.windRhumbs.save(draft);
  }

  // Единственный метод мимо ORM: логическое удаление сырым SQL по заданию.
  // Идентификатор идёт параметром $1, в текст запроса не подставляется.
  async markDeleted(
    id: number,
  ): Promise<{ id: number; status: WindRhumbStatus } | null> {
    const rows = (await this.windRhumbs.query(
      `UPDATE wind_rhumbs
          SET status = 'deleted'
        WHERE id = $1
          AND status = 'published'
      RETURNING id, status`,
      [id],
    )) as { id: number; status: WindRhumbStatus }[];

    return rows[0] ?? null;
  }

  private async withLikesCount(rhumb: WindRhumb): Promise<WindRhumbWithLikes> {
    const likesCount = await this.rhumbLikes.count({
      where: { rhumbId: rhumb.id },
    });

    return { ...rhumb, likesCount };
  }
}
