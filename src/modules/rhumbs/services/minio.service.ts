import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

@Injectable()
export class MinioService {
  private readonly client: Minio.Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('MINIO_BUCKET') ?? 'rhumbs';
    this.publicUrl = this.config.get<string>('MINIO_PUBLIC_URL') ?? '';

    this.client = new Minio.Client({
      endPoint: this.config.get<string>('MINIO_ENDPOINT') ?? 'localhost',
      port: Number(this.config.get<string>('MINIO_PORT') ?? 9000),
      useSSL: this.config.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.config.get<string>('MINIO_ACCESS_KEY') ?? '',
      secretKey: this.config.get<string>('MINIO_SECRET_KEY') ?? '',
    });
  }

  async uploadImage(
    rhumbsId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    const extension = IMAGE_EXTENSIONS[file.mimetype] ?? 'jpg';
    const key = `rhumbs-${rhumbsId}-image-${Date.now()}.${extension}`;

    await this.put(key, file);

    return key;
  }

  async uploadVideo(
    rhumbsId: number,
    file: Express.Multer.File,
  ): Promise<string> {
    const key = `rhumbs-${rhumbsId}-video-${Date.now()}.mp4`;

    await this.put(key, file);

    return key;
  }

  buildUrl(key: string): string | null {
    return key ? `${this.publicUrl}/${key}` : null;
  }

  private async put(key: string, file: Express.Multer.File): Promise<void> {
    await this.client.putObject(this.bucket, key, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });
  }
}
