import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CurrentUser } from '../../../common/current-user';
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

  async findPublished(minAzimuth?: number): Promise<RhumbsResponseDto[]> {
    const rows = await this.rhumbsRepository.findPublished(minAzimuth);

    return rows.map(({ rhumbs, likesCount }) => this.toResponse(rhumbs, likesCount));
  }

  async findFeed(id?: number, next?: boolean): Promise<RhumbsResponseDto> {
    if (id === undefined) {
      return this.withLikes(await this.rhumbsRepository.findFirstPublished());
    }

    const rhumbs = next
      ? await this.rhumbsRepository.findNextPublished(id)
      : await this.rhumbsRepository.findPublishedById(id);

    return this.withLikes(rhumbs);
  }

  async findDraft(): Promise<RhumbsResponseDto> {
    const draft = await this.rhumbsRepository.findDraftByUser(
      CurrentUser.getInstance().getId(),
    );

    return this.withLikes(draft);
  }

  async createDraft(name: string, files: RhumbsFiles): Promise<RhumbsResponseDto> {
    const userId = CurrentUser.getInstance().getId();
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

    return this.toResponse(draft, 0);
  }

  async publishDraft(payload: PublishRhumbsDto): Promise<RhumbsResponseDto> {
    const draft = await this.rhumbsRepository.findDraftByUser(
      CurrentUser.getInstance().getId(),
    );

    if (!draft) {
      throw new NotFoundException();
    }

    draft.name = payload.name;
    draft.description = payload.description;
    draft.geographicAzimuthDeg = payload.geographicAzimuthDeg;
    draft.magneticAzimuthDeg = payload.magneticAzimuthDeg.toFixed(1);
    draft.status = 'published';
    draft.formedAt = new Date();

    const published = await this.rhumbsRepository.save(draft);

    return this.withLikes(published);
  }

  async markDeleted(id: number): Promise<void> {
    const published = await this.rhumbsRepository.findPublishedByIdAndUser(
      id,
      CurrentUser.getInstance().getId(),
    );

    if (!published) {
      throw new NotFoundException();
    }

    published.status = 'deleted';

    await this.rhumbsRepository.save(published);
  }

  async setLike(id: number, value: number): Promise<RhumbsResponseDto> {
    const rhumbs = await this.rhumbsRepository.findPublishedById(id);

    if (!rhumbs) {
      throw new NotFoundException();
    }

    const userId = CurrentUser.getInstance().getId();
    const like = await this.rhumbsRepository.findLike(userId, id);

    if (value === 1 && !like) {
      await this.rhumbsRepository.addLike(userId, id);
    }

    if (value === 0 && like) {
      await this.rhumbsRepository.removeLike(like);
    }

    return this.withLikes(rhumbs);
  }

  private async withLikes(rhumbs: Rhumbs | null): Promise<RhumbsResponseDto> {
    if (!rhumbs) {
      throw new NotFoundException();
    }

    const likesCount = await this.rhumbsRepository.countLikes(rhumbs.id);

    return this.toResponse(rhumbs, likesCount);
  }

  private toResponse(rhumbs: Rhumbs, likesCount: number): RhumbsResponseDto {
    return plainToInstance(
      RhumbsResponseDto,
      {
        id: rhumbs.id,
        name: rhumbs.name,
        description: rhumbs.description,
        imageUrl: this.minio.buildUrl(rhumbs.imageKey),
        videoUrl: this.minio.buildUrl(rhumbs.videoKey),
        geographicAzimuthDeg: rhumbs.geographicAzimuthDeg,
        magneticAzimuthDeg: rhumbs.magneticAzimuthDeg,
        likesCount,
        isCreator:
          rhumbs.creatorId === CurrentUser.getInstance().getId() ? 1 : 0,
      },
      { excludeExtraneousValues: true },
    );
  }
}
