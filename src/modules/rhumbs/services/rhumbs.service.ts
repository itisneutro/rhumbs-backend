import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CurrentUser } from '../../../common/current-user';
import { Rhumb } from '../../../entities/rhumb.entity';
import { PublishRhumbDto } from '../dto/publish-rhumb.dto';
import { RhumbResponseDto } from '../dto/rhumb-response.dto';
import { TypeORMRhumbsRepository } from '../repositories/typeorm-rhumbs.repository';
import { MinioService } from './minio.service';

export type RhumbFiles = {
  image?: Express.Multer.File[];
  video?: Express.Multer.File[];
};

const IMAGE_LIMIT = 5 * 1024 * 1024;

@Injectable()
export class RhumbsService {
  constructor(
    private readonly rhumbs: TypeORMRhumbsRepository,
    private readonly minio: MinioService,
  ) {}

  async findPublished(minAzimuth?: number): Promise<RhumbResponseDto[]> {
    const rows = await this.rhumbs.findPublished(minAzimuth);

    return rows.map(({ rhumb, likesCount }) => this.toResponse(rhumb, likesCount));
  }

  async findFeed(id?: number, next?: boolean): Promise<RhumbResponseDto> {
    if (id === undefined) {
      return this.withLikes(await this.rhumbs.findFirstPublished());
    }

    const rhumb = next
      ? await this.rhumbs.findNextPublished(id)
      : await this.rhumbs.findPublishedById(id);

    return this.withLikes(rhumb);
  }

  async findDraft(): Promise<RhumbResponseDto> {
    const draft = await this.rhumbs.findDraftByUser(
      CurrentUser.getInstance().getId(),
    );

    return this.withLikes(draft);
  }

  async createDraft(name: string, files: RhumbFiles): Promise<RhumbResponseDto> {
    const userId = CurrentUser.getInstance().getId();
    const existing = await this.rhumbs.findDraftByUser(userId);

    if (existing) {
      throw new BadRequestException();
    }

    const image = files.image?.[0];
    const video = files.video?.[0];

    if (image && image.size > IMAGE_LIMIT) {
      throw new BadRequestException();
    }

    const draft = await this.rhumbs.createDraft(name, userId);

    if (image) {
      draft.imageKey = await this.minio.uploadImage(draft.id, image);
    }

    if (video) {
      draft.videoKey = await this.minio.uploadVideo(draft.id, video);
    }

    if (image || video) {
      await this.rhumbs.save(draft);
    }

    return this.toResponse(draft, 0);
  }

  async publishDraft(
    id: number,
    payload: PublishRhumbDto,
  ): Promise<RhumbResponseDto> {
    const draft = await this.rhumbs.findDraftByIdAndUser(
      id,
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

    const published = await this.rhumbs.save(draft);

    return this.withLikes(published);
  }

  async markDeleted(id: number): Promise<void> {
    const published = await this.rhumbs.findPublishedByIdAndUser(
      id,
      CurrentUser.getInstance().getId(),
    );

    if (!published) {
      throw new NotFoundException();
    }

    published.status = 'deleted';

    await this.rhumbs.save(published);
  }

  async setLike(id: number, value: number): Promise<RhumbResponseDto> {
    const rhumb = await this.rhumbs.findPublishedById(id);

    if (!rhumb) {
      throw new NotFoundException();
    }

    const userId = CurrentUser.getInstance().getId();
    const like = await this.rhumbs.findLike(userId, id);

    if (value === 1 && !like) {
      await this.rhumbs.addLike(userId, id);
    }

    if (value === 0 && like) {
      await this.rhumbs.removeLike(like);
    }

    return this.withLikes(rhumb);
  }

  private async withLikes(rhumb: Rhumb | null): Promise<RhumbResponseDto> {
    if (!rhumb) {
      throw new NotFoundException();
    }

    const likesCount = await this.rhumbs.countLikes(rhumb.id);

    return this.toResponse(rhumb, likesCount);
  }

  private toResponse(rhumb: Rhumb, likesCount: number): RhumbResponseDto {
    return plainToInstance(
      RhumbResponseDto,
      {
        id: rhumb.id,
        name: rhumb.name,
        description: rhumb.description,
        imageUrl: this.minio.buildUrl(rhumb.imageKey),
        videoUrl: this.minio.buildUrl(rhumb.videoKey),
        geographicAzimuthDeg: rhumb.geographicAzimuthDeg,
        magneticAzimuthDeg: rhumb.magneticAzimuthDeg,
        likesCount,
        isCreator:
          rhumb.creatorId === CurrentUser.getInstance().getId() ? 1 : 0,
      },
      { excludeExtraneousValues: true },
    );
  }
}
