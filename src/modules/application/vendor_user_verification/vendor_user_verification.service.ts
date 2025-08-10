import { Injectable } from '@nestjs/common';
import appConfig from '../../../config/app.config';
import * as fs from 'fs';
import * as path from 'path';
import { UserDocumentDto } from './dto/create-vendor-user-verification.dto/create-vendor-user-verification.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class VendorUserVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureStorageDirectory() {
    const storagePath = path.join(
      appConfig().storageUrl.rootUrl,
      appConfig().storageUrl.package,
    );
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
  }

  async create(
    userDocumentDto: UserDocumentDto,
    userId: string,
    file?: Express.Multer.File,
  ) {
    // Check if user exists
    const userData = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!userData) {
      throw new Error('User not found');
    }

    // Derive file metadata from upload (if provided)
    const file_name = file?.originalname ?? userDocumentDto.file_name;
    const file_path = file?.filename ?? userDocumentDto.file_path;
    const file_type = file?.mimetype ?? userDocumentDto.file_type;

    if (!file_name || !file_path || !file_type) {
      throw new Error('Document file is required or provide file_name, file_path, and file_type.');
    }

    const document = await this.prisma.userDocument.create({
      data: {
        user: { connect: { id: userId } },
        type: userDocumentDto.type,
        file_type,
        file_path,
        file_name,
        status: userDocumentDto.status ?? 'pending',
      },
    });

    return {
      success: true,
      data: document,
      message: 'Document uploaded for vendor verification.',
    };
  }
}
