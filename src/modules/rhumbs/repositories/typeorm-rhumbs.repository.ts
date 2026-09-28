import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { RhumbLike } from '../../../entities/rhumb-like.entity';
import { Rhumb } from '../../../entities/rhumb.entity';

export type RhumbWithLikes = { rhumb: Rhumb; likesCount: number };

@Injectable()
export class TypeORMRhumbsRepository {
  constructor(
    @InjectRepository(Rhumb)
    private readonly rhumbs: Repository<Rhumb>,
    @InjectRepository(RhumbLike)
    private readonly likes: Repository<RhumbLike>,
  ) {}

  async findPublished(minAzimuth?: number): Promise<RhumbWithLikes[]> {
    const query = this.rhumbs
      .createQueryBuilder('rhumb')
      .leftJoin(RhumbLike, 'like', 'like.rhumb_id = rhumb.id')
      .addSelect('COUNT(like.id)', 'likes_count')
      .where('rhumb.status = :status', { status: 'published' })
      .groupBy('rhumb.id')
      .orderBy('rhumb.id', 'ASC');

    if (minAzimuth !== undefined) {
      query.andWhere('rhumb.geographicAzimuthDeg >= :minAzimuth', {
        minAzimuth,
      });
    }

    const { entities, raw } = await query.getRawAndEntities();

    return entities.map((rhumb, index) => ({
      rhumb,
      likesCount: Number(raw[index].likes_count),
    }));
  }

  async findFirstPublished(): Promise<Rhumb | null> {
    return this.rhumbs.findOne({
      where: { status: 'published' },
      order: { id: 'ASC' },
    });
  }

  async findPublishedById(id: number): Promise<Rhumb | null> {
    return this.rhumbs.findOne({ where: { id, status: 'published' } });
  }

  async findNextPublished(id: number): Promise<Rhumb | null> {
    const next = await this.rhumbs.findOne({
      where: { status: 'published', id: MoreThan(id) },
      order: { id: 'ASC' },
    });

    return next ?? this.findFirstPublished();
  }

  async findDraftByUser(userId: number): Promise<Rhumb | null> {
    return this.rhumbs.findOne({
      where: { status: 'draft', creatorId: userId },
      order: { id: 'ASC' },
    });
  }

  async findDraftByIdAndUser(id: number, userId: number): Promise<Rhumb | null> {
    return this.rhumbs.findOne({
      where: { id, status: 'draft', creatorId: userId },
    });
  }

  async findPublishedByIdAndUser(
    id: number,
    userId: number,
  ): Promise<Rhumb | null> {
    return this.rhumbs.findOne({
      where: { id, status: 'published', creatorId: userId },
    });
  }

  async createDraft(name: string, creatorId: number): Promise<Rhumb> {
    const draft = this.rhumbs.create({
      name,
      description: null,
      imageKey: '',
      videoKey: '',
      status: 'draft',
      geographicAzimuthDeg: null,
      magneticAzimuthDeg: null,
      creatorId,
      formedAt: null,
    });

    return this.rhumbs.save(draft);
  }

  async save(rhumb: Rhumb): Promise<Rhumb> {
    return this.rhumbs.save(rhumb);
  }

  async countLikes(rhumbId: number): Promise<number> {
    return this.likes.count({ where: { rhumbId } });
  }

  async findLike(userId: number, rhumbId: number): Promise<RhumbLike | null> {
    return this.likes.findOne({ where: { userId, rhumbId } });
  }

  async addLike(userId: number, rhumbId: number): Promise<void> {
    await this.likes.save(this.likes.create({ userId, rhumbId }));
  }

  async removeLike(like: RhumbLike): Promise<void> {
    await this.likes.remove(like);
  }
}
