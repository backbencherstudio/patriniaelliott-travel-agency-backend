import { Injectable } from '@nestjs/common';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';
import { DateHelper } from '../../../common/helper/date.helper';
import { UserRepository } from '../../../common/repository/user/user.repository';
import { StringHelper } from '../../../common/helper/string.helper';
import { NotificationRepository } from '../../../common/repository/notification/notification.repository';
import { MessageGateway } from '../../../modules/chat/message/message.gateway';

@Injectable()
export class BlogService {
  constructor(
    private prisma: PrismaService,
    private readonly messageGateway: MessageGateway,
  ) {}

  async create(
    createBlogDto: CreateBlogDto,
    user_id: string,
    images: Express.Multer.File[],
  ) {
    try {
      const data = {};
      if (createBlogDto.title) {
        data['title'] = createBlogDto.title;
      }
      if (createBlogDto.description) {
        data['description'] = createBlogDto.description;
      }
      if (createBlogDto.body) {
        data['body'] = createBlogDto.body;
        data['read_time'] = StringHelper.getReadTime(createBlogDto.body);
      }

      // add vendor id if the package is from vendor
      const userDetails = await UserRepository.getUserDetails(user_id);
      if (userDetails && userDetails.type != 'vendor') {
        data['status'] = 1;
        data['approved_at'] = DateHelper.now();
      }

      const blog = await this.prisma.blog.create({
        data: {
          ...data,
          user_id,
        },
      });

      if (images.length > 0) {
        await this.prisma.blogImage.createMany({
          data: images.map((image) => ({
            blog_id: blog.id,
            image: image.filename,
          })),
        });
      }

      if (userDetails && userDetails.type != 'admin') {
        // notify the admin that the package is created
        await NotificationRepository.createNotification({
          sender_id: user_id,
          text: 'Blog has been created',
          type: 'blog',
          entity_id: blog.id,
        });

        this.messageGateway.server.emit('notification', {
          sender_id: user_id,
          text: 'Blog has been created',
          type: 'blog',
          entity_id: blog.id,
        });
      }

      return {
        success: true,
        message: 'Blog created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll({
    q = null,
    status = null,
    approve,
  }: {
    q?: string;
    status?: number;
    approve?: string;
  }) {
    try {
      const whereClause = {};
      if (q) {
        whereClause['OR'] = [{ title: { contains: q, mode: 'insensitive' } }];
      }
      if (status) {
        whereClause['status'] = Number(status);
      }
      if (approve) {
        if (approve === 'approved') {
          whereClause['approved_at'] = { not: null };
        } else {
          whereClause['approved_at'] = null;
        }
      }

      const blogs = await this.prisma.blog.findMany({
        where: { ...whereClause },
        select: {
          id: true,
          title: true,
          description: true,
          approved_at: true,
          created_at: true,
          updated_at: true,
          status: true,
          read_time: true,
          blog_images: {
            select: {
              image: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
      // add image url
      for (const blog of blogs) {
        for (const image of blog.blog_images) {
          image['image_url'] = SojebStorage.url(
            appConfig().storageUrl.blog + image.image,
          );
        }
      }

      return {
        success: true,
        data: blogs,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string) {
    try {
      const blog = await this.prisma.blog.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          body: true,
          read_time: true,
          approved_at: true,
          created_at: true,
          updated_at: true,
          status: true,
          blog_images: {
            select: {
              image: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      if (!blog) {
        return {
          success: false,
          message: 'Blog not found',
        };
      }

      // add image url
      if (blog.blog_images && blog.blog_images.length > 0) {
        for (const image of blog.blog_images) {
          image['image_url'] = SojebStorage.url(
            appConfig().storageUrl.blog + image.image,
          );
        }
      }

      return {
        success: true,
        data: blog,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(
    id: string,
    updateBlogDto: UpdateBlogDto,
    images: Express.Multer.File[],
  ) {
    try {
      const data = {};
      if (updateBlogDto.title) {
        data['title'] = updateBlogDto.title;
      }
      if (updateBlogDto.description) {
        data['description'] = updateBlogDto.description;
      }
      if (updateBlogDto.body) {
        data['body'] = updateBlogDto.body;
        data['read_time'] = StringHelper.getReadTime(updateBlogDto.body);
      }
      const blog = await this.prisma.blog.update({
        where: { id },
        data: {
          ...data,
          updated_at: DateHelper.now(),
        },
      });

      if (images.length > 0) {
        const blogImages = await this.prisma.blogImage.findMany({
          where: { blog_id: blog.id },
        });
        // delete images from storage
        for (const image of blogImages) {
          await SojebStorage.delete(appConfig().storageUrl.blog + image.image);
        }
        await this.prisma.blogImage.deleteMany({
          where: { blog_id: blog.id },
        });
        // create new images
        await this.prisma.blogImage.createMany({
          data: images.map((image) => ({
            blog_id: blog.id,
            image: image.filename,
          })),
        });
      }
      return {
        success: true,
        message: 'Blog updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async updateStatus(id: string, status: number) {
    try {
      const record = await this.prisma.blog.findUnique({
        where: { id },
      });

      if (!record) {
        return {
          success: false,
          message: 'Blog not found',
        };
      }

      await this.prisma.blog.update({
        where: { id },
        data: { status: status },
      });

      return {
        success: true,
        message: 'Blog status updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async approve(id: string) {
    try {
      const record = await this.prisma.blog.findUnique({
        where: { id },
      });
      if (!record) {
        return {
          success: false,
          message: 'Blog not found',
        };
      }
      await this.prisma.blog.update({
        where: { id },
        data: { approved_at: DateHelper.now() },
      });
      return {
        success: true,
        message: 'Blog approved successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async reject(id: string) {
    try {
      const record = await this.prisma.blog.findUnique({
        where: { id },
      });
      if (!record) {
        return {
          success: false,
          message: 'Blog not found',
        };
      }
      await this.prisma.blog.update({
        where: { id },
        data: { approved_at: null },
      });
      return {
        success: true,
        message: 'Blog rejected successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string) {
    try {
      // use transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // delete images from storage
        const blogImages = await tx.blogImage.findMany({
          where: { blog_id: id },
        });
        for (const image of blogImages) {
          await SojebStorage.delete(appConfig().storageUrl.blog + image.image);
        }
        await tx.blogImage.deleteMany({
          where: { blog_id: id },
        });
        await tx.blog.delete({
          where: { id },
        });

        return {
          success: true,
          message: 'Blog deleted successfully',
        };
      });
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
