import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { RhumbsLikes } from '../../../entities/rhumbs-likes.entity';
import { Rhumbs } from '../../../entities/rhumbs.entity';

export type RhumbsWithLikes = { rhumbs: Rhumbs; likesCount: number };

@Injectable()
export class TypeORMRhumbsRepository {
  constructor(
    @InjectRepository(Rhumbs)
    private readonly rhumbsRepository: Repository<Rhumbs>,
    @InjectRepository(RhumbsLikes)
    private readonly likesRepository: Repository<RhumbsLikes>,
  ) {}

  async findPublished(minAzimuth?: number): Promise<RhumbsWithLikes[]> {
    const query = this.rhumbsRepository
      .createQueryBuilder('rhumbs')
      .leftJoin(RhumbsLikes, 'like', 'like.rhumbs_id = rhumbs.id')
      .addSelect('COUNT(like.id)', 'likes_count')
      .where('rhumbs.status = :status', { status: 'published' })
      .groupBy('rhumbs.id')
      .orderBy('rhumbs.id', 'ASC');

    if (minAzimuth !== undefined) {
      query.andWhere('rhumbs.geographicAzimuthDeg >= :minAzimuth', {
        minAzimuth,
      });
    }

    const { entities, raw } = await query.getRawAndEntities();

    return entities.map((rhumbs, index) => ({
      rhumbs,
      likesCount: Number(raw[index].likes_count),
    }));
  }

  async findFirstPublished(): Promise<Rhumbs | null> {
    return this.rhumbsRepository.findOne({
      where: { status: 'published' },
      order: { id: 'ASC' },
    });
  }

  async findPublishedById(id: number): Promise<Rhumbs | null> {
    return this.rhumbsRepository.findOne({ where: { id, status: 'published' } });
  }

  async findNextPublished(id: number): Promise<Rhumbs | null> {
    const next = await this.rhumbsRepository.findOne({
      where: { status: 'published', id: MoreThan(id) },
      order: { id: 'ASC' },
    });

    return next ?? this.findFirstPublished();
  }

  async findDraftByUser(userId: number): Promise<Rhumbs | null> {
    return this.rhumbsRepository.findOne({
      where: { status: 'draft', creatorId: userId },
      order: { id: 'ASC' },
    });
  }

  async findPublishedByIdAndUser(
    id: number,
    userId: number,
  ): Promise<Rhumbs | null> {
    return this.rhumbsRepository.findOne({
      where: { id, status: 'published', creatorId: userId },
    });
  }

  async createDraft(name: string, creatorId: number): Promise<Rhumbs> {
    const draft = this.rhumbsRepository.create({
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

    return this.rhumbsRepository.save(draft);
  }

  async save(rhumbs: Rhumbs): Promise<Rhumbs> {
    return this.rhumbsRepository.save(rhumbs);
  }

  async countLikes(rhumbsId: number): Promise<number> {
    return this.likesRepository.count({ where: { rhumbsId } });
  }

  async findLike(userId: number, rhumbsId: number): Promise<RhumbsLikes | null> {
    return this.likesRepository.findOne({ where: { userId, rhumbsId } });
  }

  async addLike(userId: number, rhumbsId: number): Promise<void> {
    await this.likesRepository.save(this.likesRepository.create({ userId, rhumbsId }));
  }

  async removeLike(like: RhumbsLikes): Promise<void> {
    await this.likesRepository.remove(like);
  }
}
