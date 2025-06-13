import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import appConfig from '../../../config/app.config';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import { LikeRepository } from '../../../common/repository/like/like.repository';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  async findAll({ q = null, status = null }: { q?: string; status?: number }) {
    try {
      const whereClause = {};
      if (q) {
        whereClause['OR'] = [{ title: { contains: q, mode: 'insensitive' } }];
        // whereClause['OR'] = [{ title: { search: q, mode: 'insensitive' } }];
      }
      if (status) {
        whereClause['status'] = Number(status);
      }

      const blogs = await this.prisma.blog.findMany({
        where: { ...whereClause },
        select: {
          id: true,
          title: true,
          description: true,
          read_time: true,
          created_at: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              type: true,
            },
          },
          blog_images: {
            select: {
              id: true,
              image: true,
            },
          },
        },
      });

      // add image url
      for (const blog of blogs) {
        if (blog.blog_images.length > 0) {
          for (const image of blog.blog_images) {
            image['image_url'] = SojebStorage.url(
              appConfig().storageUrl.blog + image.image,
            );
          }
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
          body: true,
          like_count: true,
          description: true,
          read_time: true,
          created_at: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              type: true,
            },
          },
          blog_images: {
            select: {
              id: true,
              image: true,
            },
          },
          blog_comments: {
            select: {
              id: true,
              comment: true,
              created_at: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
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

      // add is liked
      const isLiked = await this.prisma.like.findFirst({
        where: {
          likeable_id: id,
          likeable_type: 'blog',
          user_id: blog.user.id,
        },
      });

      blog['is_liked'] = isLiked ? true : false;

      // add image url
      if (blog.blog_images.length > 0) {
        for (const image of blog.blog_images) {
          image['image_url'] = SojebStorage.url(
            appConfig().storageUrl.blog + image.image,
          );
        }
      }

      // add avatar url
      if (blog.user && blog.user.avatar) {
        blog.user.avatar = SojebStorage.url(
          appConfig().storageUrl.avatar + blog.user.avatar,
        );
      }

      // add comment avatar url
      if (blog.blog_comments.length > 0) {
        for (const comment of blog.blog_comments) {
          if (comment.user.avatar) {
            comment.user.avatar = SojebStorage.url(
              appConfig().storageUrl.avatar + comment.user.avatar,
            );
          }
        }
      }

      // add recent post
      const recentBlogs = await this.prisma.blog.findMany({
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          title: true,
          created_at: true,
          blog_images: {
            select: {
              image: true,
            },
          },
        },
        take: 3,
      });

      // add image url
      for (const post of recentBlogs) {
        if (post.blog_images.length > 0) {
          for (const image of post.blog_images) {
            image['image_url'] = SojebStorage.url(
              appConfig().storageUrl.blog + image.image,
            );
          }
        }
      }

      blog['recent_blogs'] = recentBlogs;

      // add featured blog
      const featuredBlog = await this.prisma.blog.findFirst({
        orderBy: {
          like_count: 'desc',
        },
        take: 1,
        select: {
          id: true,
          title: true,
          created_at: true,
          blog_images: {
            select: {
              image: true,
            },
          },
        },
      });

      // add image url
      if (featuredBlog.blog_images.length > 0) {
        for (const image of featuredBlog.blog_images) {
          image['image_url'] = SojebStorage.url(
            appConfig().storageUrl.blog + image.image,
          );
        }
      }

      blog['featured_blog'] = featuredBlog;

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

  async search(keyword: string) {
    try {
      // measure time
      const start = performance.now();
      const blogs = await this.prisma.blog.findMany({
        where: {
          title: {
            contains: keyword,
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          created_at: true,
          blog_images: {
            select: {
              image: true,
            },
          },
        },
      });

      // add image url
      if (blogs.length > 0) {
        for (const blog of blogs) {
          if (blog.blog_images.length > 0) {
            for (const image of blog.blog_images) {
              image['image_url'] = SojebStorage.url(
                appConfig().storageUrl.blog + image.image,
              );
            }
          }
        }
      }

      const end = performance.now();
      const time = (end - start) / 1000; // in seconds

      return {
        success: true,
        time: time,
        data: blogs,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // like a blog
  async react(user_id: string, blog_id: string) {
    const likeExist = await this.prisma.like.findFirst({
      where: {
        likeable_id: blog_id,
        likeable_type: 'blog',
        user_id: user_id,
      },
    });

    if (likeExist) {
      await this.prisma.like.delete({
        where: {
          id: likeExist.id,
        },
      });

      await LikeRepository.updateLikeCount(blog_id, 'blog');

      return {
        success: true,
        message: 'Blog unliked successfully',
      };
    } else {
      await this.prisma.like.create({
        data: {
          likeable_type: 'blog',
          likeable_id: blog_id,
          user_id: user_id,
        },
      });

      await LikeRepository.updateLikeCount(blog_id, 'blog');

      return {
        success: true,
        message: 'Blog liked successfully',
      };
    }
  }

  async comment(
    user_id: string,
    blog_id: string,
    commentDto: CreateCommentDto,
  ) {
    try {
      const blog = await this.prisma.blog.findUnique({
        where: { id: blog_id },
      });

      if (!blog) {
        return {
          success: false,
          message: 'Blog not found',
        };
      }

      const comment = commentDto.comment;

      await this.prisma.blogComment.create({
        data: {
          blog_id: blog_id,
          user_id: user_id,
          comment: comment,
        },
      });

      return {
        success: true,
        message: 'Comment added successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async deleteComment(user_id: string, comment_id: string) {
    try {
      const comment = await this.prisma.blogComment.findUnique({
        where: { id: comment_id },
      });

      if (!comment) {
        return {
          success: false,
          message: 'Comment not found',
        };
      }
      // check if the comment is owned by the user
      if (comment.user_id != user_id) {
        return {
          success: false,
          message: 'You are not allowed to delete this comment',
        };
      }
      await this.prisma.blogComment.delete({
        where: { id: comment_id },
      });

      return {
        success: true,
        message: 'Comment deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
