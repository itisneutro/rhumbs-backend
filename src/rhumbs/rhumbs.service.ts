import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { RhumbLike } from './entities/rhumb-like.entity';
import { Rhumb } from './entities/rhumb.entity';

export const CURRENT_USER_ID = 4;

type RhumbWithLikes = Rhumb & { likesCount: number };

@Injectable()
export class RhumbsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Rhumb)
    private readonly rhumbs: Repository<Rhumb>,
    @InjectRepository(RhumbLike)
    private readonly rhumbsLikes: Repository<RhumbLike>,
  ) {}

  async findPublished(minAzimuth?: number): Promise<RhumbWithLikes[]> {
    const query = this.rhumbs
      .createQueryBuilder('rhumb')
      .leftJoin(RhumbLike, 'rhumbLike', 'rhumbLike.rhumbId = rhumb.id')
      .addSelect('COUNT(rhumbLike.id)', 'likesCount')
      .where('rhumb.status = :status', { status: 'published' })
      .groupBy('rhumb.id')
      .orderBy('rhumb.geographicAzimuthDeg', 'ASC');

    if (minAzimuth !== undefined && Number.isFinite(minAzimuth)) {
      query.andWhere('rhumb.geographicAzimuthDeg >= :minAzimuth', {
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

  async findPublishedById(id: number): Promise<Rhumb | null> {
    return this.rhumbs.findOne({ where: { id, status: 'published' } });
  }

  async findNextPublished(id: number): Promise<Rhumb | null> {
    const next = await this.rhumbs.findOne({
      where: { status: 'published', id: MoreThan(id) },
      order: { id: 'ASC' },
    });

    if (next) {
      return next;
    }

    return this.rhumbs.findOne({
      where: { status: 'published' },
      order: { id: 'ASC' },
    });
  }

  async countLikes(rhumbId: number): Promise<number> {
    return this.rhumbsLikes.count({ where: { rhumbId } });
  }

  async findDraftByUser(userId: number): Promise<Rhumb | null> {
    return this.rhumbs.findOne({
      where: { status: 'draft', creatorId: userId },
      order: { id: 'ASC' },
    });
  }

  async createDraft(name: string): Promise<Rhumb> {
    const existing = await this.findDraftByUser(CURRENT_USER_ID);

    if (existing) {
      return existing;
    }

    const draft = this.rhumbs.create({
      name,
      imageUrl: '',
      videoUrl: '',
      status: 'draft',
      creatorId: CURRENT_USER_ID,
      description: null,
      geographicAzimuthDeg: null,
      magneticAzimuthDeg: null,
      formedAt: null,
    });

    return this.rhumbs.save(draft);
  }

  async publishDraft(
    id: number,
    name: string,
    description: string | null,
    geographicAzimuthDeg: number | null,
    magneticAzimuthDeg: string | null,
  ): Promise<void> {
    const draft = await this.rhumbs.findOne({
      where: { id, status: 'draft', creatorId: CURRENT_USER_ID },
    });

    if (!draft) {
      return;
    }

    draft.name = name;
    draft.description = description;
    draft.geographicAzimuthDeg = geographicAzimuthDeg;
    draft.magneticAzimuthDeg = magneticAzimuthDeg;
    draft.status = 'published';
    draft.formedAt = new Date();

    await this.rhumbs.save(draft);
  }

  async markDeleted(id: number): Promise<boolean> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();

    try {
      const [rows] = (await runner.query(
        "UPDATE rhumbs SET status = $2 WHERE id = $1 AND status = 'published' RETURNING id",
        [id, 'deleted'],
      )) as [{ id: number }[], number];

      return rows.length > 0;
    } finally {
      await runner.release();
    }
  }
}
