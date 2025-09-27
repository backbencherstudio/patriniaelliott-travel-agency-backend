import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';

@Injectable()
export class PageService {
  constructor(private prisma: PrismaService) {}

  async homePage() {
    try {
      const destinations = await this.prisma.destination.findMany({
        where: {
          status: 1,
        },
        select: {
          id: true,
          name: true,
          destination_images: {
            select: {
              image: true,
            },
          },
          country: {
            select: {
              name: true,
            },
          },
        },
      });

      if (destinations.length > 0) {
        for (const destination of destinations) {
          // add image url to destinations
          if (destination.destination_images.length > 0) {
            for (const image of destination.destination_images) {
              image['image_url'] = SojebStorage.url(
                appConfig().storageUrl.destination + image.image,
              );
            }
          }
          // add tour count
          destination['tour_count'] = await this.prisma.package.count({
            where: {
              package_destinations: {
                some: {
                  destination_id: destination.id,
                },
              },
            },
          });
        }
      }

      const packages = await this.prisma.package.findMany({
        where: {
          status: 1,
          type: 'package',
        },
        take: 3,
        select: {
          id: true,
          created_at: true,
          updated_at: true,
          user_id: true,
          name: true,
          description: true,
          price: true,
          duration: true,
          min_capacity: true,
          max_capacity: true,
          type: true,
          package_categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          package_traveller_types: {
            select: {
              traveller_type: {
                select: {
                  id: true,
                  type: true,
                },
              },
            },
          },
          package_languages: {
            select: {
              language: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          reviews: {
            select: {
              id: true,
              rating_value: true,
              comment: true,
              user_id: true,
            },
          },
          package_destinations: {
            select: {
              destination: {
                select: {
                  id: true,
                  name: true,
                  country: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          cancellation_policy: true,
          package_files: {
            select: {
              id: true,
              file: true,
            },
          },
          package_trip_plans: {
            select: {
              id: true,
              title: true,
              description: true,
              package_trip_plan_images: {
                select: {
                  id: true,
                  image: true,
                },
              },
            },
          },
          package_tags: {
            select: {
              tag_id: true,
              type: true,
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
      // add image url package_files
      if (packages && packages.length > 0) {
        for (const record of packages) {
          if ((record as any).package_files) {
            for (const file of (record as any).package_files) {
              file['file_url'] = SojebStorage.url(
                appConfig().storageUrl.package + file.file,
              );
            }
          }
        }
      }

      // get reviews for the packages
      for (const record of packages) {
        const reviews = await this.prisma.review.findMany({
          where: {
            package_id: record.id,
          },
          select: {
            id: true,
            rating_value: true,
            comment: true,
          },
        });

        // calculate avarage rating
        let totalRating = 0;
        let totalReviews = 0;
        for (const review of reviews) {
          totalRating += review.rating_value;
          totalReviews++;
        }
        const averageRating = totalRating / totalReviews;
        record['average_rating'] = averageRating;
      }

      const reviews = await this.prisma.review.findMany({
        where: {
          status: 1,
        },
        take: 6,
        select: {
          id: true,
          rating_value: true,
          comment: true,
          user_id: true,
        },
      });

      const blogs = await this.prisma.blog.findMany({
        where: {
          status: 1,
          approved_at: {
            not: null,
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 3,
        select: {
          id: true,
          title: true,
          description: true,
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
              avatar: true,
            },
          },
        },
      });

      // add avatar url
      if (blogs && blogs.length > 0) {
        for (const blog of blogs) {
          if (blog.user && blog.user.avatar) {
            blog.user['avatar_url'] = SojebStorage.url(
              appConfig().storageUrl.avatar + blog.user.avatar,
            );
          }
        }
      }

      // add image url blog_images
      if (blogs && blogs.length > 0) {
        for (const blog of blogs) {
          if (blog.blog_images && blog.blog_images.length > 0) {
            for (const image of blog.blog_images) {
              image['image_url'] = SojebStorage.url(
                appConfig().storageUrl.blog + image.image,
              );
            }
          }
        }
      }

      const faqs = await this.prisma.faq.findMany({
        orderBy: {
          sort_order: 'asc',
        },
        select: {
          id: true,
          question: true,
          answer: true,
        },
      });

      return {
        success: true,
        data: {
          destinations: destinations,
          packages: packages,
          reviews: reviews,
          blogs: blogs,
          faqs: faqs,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
