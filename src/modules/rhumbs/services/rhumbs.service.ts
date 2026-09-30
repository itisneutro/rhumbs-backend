import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Rhumbs } from '../../../entities/rhumbs.entity';
import { PublishRhumbsDto } from '../dto/publish-rhumbs.dto';
import { RhumbsResponseDto } from '../dto/rhumbs-response.dto';
import { TypeORMRhumbsRepository } from '../repositories/typeorm-rhumbs.repository';
import { MinioService } from './minio.service';

export type RhumbsFiles = {
  image?: Express.Multer.File[];
  video?: Express.Multer.File[];
};

const IMAGE_LIMIT = 5 * 1024 * 1024;

@Injectable()
export class RhumbsService {
  constructor(
    private readonly rhumbsRepository: TypeORMRhumbsRepository,
    private readonly minio: MinioService,
  ) {}

  async findPublished(
    userId: number,
    minAzimuth?: number,
  ): Promise<RhumbsResponseDto[]> {
    const rows = await this.rhumbsRepository.findPublished(userId, minAzimuth);

    return rows.map(({ rhumbs, likesCount, isLiked }) =>
      this.toResponse(rhumbs, likesCount, isLiked, userId),
    );
  }

  async findFeed(
    userId: number,
    id?: number,
    next?: boolean,
  ): Promise<RhumbsResponseDto> {
    if (id === undefined) {
      return this.withLikes(
        await this.rhumbsRepository.findFirstPublished(),
        userId,
      );
    }

    const rhumbs = next
      ? await this.rhumbsRepository.findNextPublished(id)
      : await this.rhumbsRepository.findPublishedById(id);

    return this.withLikes(rhumbs, userId);
  }

  async findDraft(userId: number): Promise<RhumbsResponseDto> {
    const draft = await this.rhumbsRepository.findDraftByUser(userId);

    return this.withLikes(draft, userId);
  }

  async createDraft(
    userId: number,
    name: string,
    files: RhumbsFiles,
  ): Promise<RhumbsResponseDto> {
    const existing = await this.rhumbsRepository.findDraftByUser(userId);

    if (existing) {
      throw new BadRequestException();
    }

    const image = files.image?.[0];
    const video = files.video?.[0];

    if (image && image.size > IMAGE_LIMIT) {
      throw new BadRequestException();
    }

    const draft = await this.rhumbsRepository.createDraft(name, userId);

    if (image) {
      draft.imageKey = await this.minio.uploadImage(draft.id, image);
    }

    if (video) {
      draft.videoKey = await this.minio.uploadVideo(draft.id, video);
    }

    if (image || video) {
      await this.rhumbsRepository.save(draft);
    }

    return this.toResponse(draft, 0, 0, userId);
  }

  async publishDraft(
    userId: number,
    payload: PublishRhumbsDto,
  ): Promise<RhumbsResponseDto> {
    const draft = await this.rhumbsRepository.findDraftByUser(userId);

    if (!draft) {
      throw new NotFoundException();
    }

    draft.name = payload.name;
    draft.description = payload.description;
    draft.geoAzimuth = payload.geoAzimuth;
    draft.magAzimuth = payload.magAzimuth.toFixed(1);
    draft.status = 'published';
    draft.formedAt = new Date();

    const published = await this.rhumbsRepository.save(draft);

    return this.withLikes(published, userId);
  }

  async markDeleted(userId: number, id: number): Promise<void> {
    const published = await this.rhumbsRepository.findPublishedByIdAndUser(
      id,
      userId,
    );

    if (!published) {
      throw new NotFoundException();
    }

    published.status = 'deleted';

    await this.rhumbsRepository.save(published);
  }

  async setLike(
    userId: number,
    id: number,
    value: number,
  ): Promise<RhumbsResponseDto> {
    const rhumbs = await this.rhumbsRepository.findPublishedById(id);

    if (!rhumbs) {
      throw new NotFoundException();
    }

    const like = await this.rhumbsRepository.findLike(userId, id);

    if (value === 1 && !like) {
      await this.rhumbsRepository.addLike(userId, id);
    }

    if (value === 0 && like) {
      await this.rhumbsRepository.removeLike(like);
    }

    return this.withLikes(rhumbs, userId);
  }

  private async withLikes(
    rhumbs: Rhumbs | null,
    userId: number,
  ): Promise<RhumbsResponseDto> {
    if (!rhumbs) {
      throw new NotFoundException();
    }

    const likesCount = await this.rhumbsRepository.countLikes(rhumbs.id);
    const liked = await this.rhumbsRepository.existsLike(userId, rhumbs.id);

    return this.toResponse(rhumbs, likesCount, liked ? 1 : 0, userId);
  }

  private toResponse(
    rhumbs: Rhumbs,
    likesCount: number,
    isLiked: number,
    userId: number,
  ): RhumbsResponseDto {
    return plainToInstance(
      RhumbsResponseDto,
      {
        id: rhumbs.id,
        name: rhumbs.name,
        description: rhumbs.description,
        imageUrl: this.minio.buildUrl(rhumbs.imageKey),
        videoUrl: this.minio.buildUrl(rhumbs.videoKey),
        geoAzimuth: rhumbs.geoAzimuth,
        magAzimuth: rhumbs.magAzimuth,
        likesCount,
        isCreator: rhumbs.creatorId === userId ? 1 : 0,
        isLiked,
      },
      { excludeExtraneousValues: true },
    );
  }
}
