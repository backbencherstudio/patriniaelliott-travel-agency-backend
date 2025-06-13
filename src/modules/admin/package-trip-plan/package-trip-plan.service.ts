import { Injectable } from '@nestjs/common';
import { CreatePackageTripPlanDto } from './dto/create-package-trip-plan.dto';
import { UpdatePackageTripPlanDto } from './dto/update-package-trip-plan.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';
import { DateHelper } from '../../../common/helper/date.helper';

@Injectable()
export class PackageTripPlanService {
  constructor(private prisma: PrismaService) {}

  async create(
    package_id: string,
    createPackageTripPlanDto: CreatePackageTripPlanDto,
    images?: Express.Multer.File[],
  ) {
    try {
      const data: any = {};
      if (createPackageTripPlanDto.title) {
        data.title = createPackageTripPlanDto.title;
      }
      if (createPackageTripPlanDto.description) {
        data.description = createPackageTripPlanDto.description;
      }
      // check if package exists
      const record = await this.prisma.package.findUnique({
        where: { id: package_id },
      });
      if (!record) {
        return {
          success: false,
          message: 'Package not found',
        };
      }

      // create trip plan
      const trip_plan = await this.prisma.packageTripPlan.create({
        data: {
          ...data,
          package_id,
        },
      });

      // save trip plan images
      if (images && images.length > 0) {
        const trip_plan_images_data = images.map((image) => ({
          image: image.filename,
          package_trip_plan_id: trip_plan.id,
        }));
        await this.prisma.packageTripPlanImage.createMany({
          data: trip_plan_images_data,
        });
      }

      return {
        success: true,
        message: 'Trip plan created successfully',
      };
    } catch (error) {
      // delete trip plan images from storage
      if (images && images.length > 0) {
        for (const image of images) {
          await SojebStorage.delete(
            appConfig().storageUrl.package + image.filename,
          );
        }
      }

      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll() {
    try {
      const package_trip_plans = await this.prisma.packageTripPlan.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          package_id: true,
          package_trip_plan_images: {
            select: {
              image: true,
            },
          },
        },
      });

      // add image url to trip plan
      if (package_trip_plans && package_trip_plans.length > 0) {
        for (const trip_plan of package_trip_plans) {
          if (
            trip_plan.package_trip_plan_images &&
            trip_plan.package_trip_plan_images.length > 0
          ) {
            for (const image of trip_plan.package_trip_plan_images) {
              image['image_url'] = SojebStorage.url(
                appConfig().storageUrl.package + image.image,
              );
            }
          }
        }
      }
      return {
        success: true,
        data: package_trip_plans,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findOne(id: string, package_id: string) {
    try {
      const trip_plan = await this.prisma.packageTripPlan.findUnique({
        where: { id: id, package_id: package_id },
        select: {
          id: true,
          title: true,
          description: true,
          package_id: true,
          package_trip_plan_images: {
            select: {
              id: true,
              image: true,
            },
          },
        },
      });

      // add image url to trip plan
      if (
        trip_plan &&
        trip_plan.package_trip_plan_images &&
        trip_plan.package_trip_plan_images.length > 0
      ) {
        for (const image of trip_plan.package_trip_plan_images) {
          image['image_url'] = SojebStorage.url(
            appConfig().storageUrl.package + image.image,
          );
        }
      }

      if (!trip_plan) {
        return {
          success: false,
          message: 'Trip plan not found',
        };
      }
      return {
        success: true,
        data: trip_plan,
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
    package_id: string,
    updatePackageTripPlanDto: UpdatePackageTripPlanDto,
    images?: Express.Multer.File[],
  ) {
    try {
      const data: any = {};
      if (updatePackageTripPlanDto.title) {
        data.title = updatePackageTripPlanDto.title;
      }
      if (updatePackageTripPlanDto.description) {
        data.description = updatePackageTripPlanDto.description;
      }

      const trip_plan = await this.prisma.packageTripPlan.findUnique({
        where: { id, package_id },
      });
      if (!trip_plan) {
        return {
          success: false,
          message: 'Trip plan not found',
        };
      }
      await this.prisma.packageTripPlan.update({
        where: { id, package_id },
        data: {
          ...data,
          updated_at: DateHelper.now(),
        },
      });

      // handle images
      // old images
      const old_images = await this.prisma.packageTripPlanImage.findMany({
        where: { package_trip_plan_id: trip_plan.id },
      });

      if (updatePackageTripPlanDto.images) {
        const images = JSON.parse(updatePackageTripPlanDto.images);

        // delete old image that are not in the new package images
        for (const old_image of old_images) {
          if (!images.some((pi) => pi.id == old_image.id)) {
            await SojebStorage.delete(
              appConfig().storageUrl.package + old_image.image,
            );
            await this.prisma.packageTripPlanImage.delete({
              where: { id: old_image.id, package_trip_plan_id: trip_plan.id },
            });
          }
        }
      }

      // save trip plan images
      if (images && images.length > 0) {
        // add new images
        const trip_plan_images_data = images.map((image) => ({
          image: image.filename,
          package_trip_plan_id: trip_plan.id,
        }));
        await this.prisma.packageTripPlanImage.createMany({
          data: trip_plan_images_data,
        });
      }

      return {
        success: true,
        message: 'Trip plan updated successfully',
      };
    } catch (error) {
      // delete trip plan images from storage
      if (images && images.length > 0) {
        for (const image of images) {
          await SojebStorage.delete(
            appConfig().storageUrl.package + image.filename,
          );
        }
      }
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async remove(id: string, package_id: string) {
    try {
      const trip_plan = await this.prisma.packageTripPlan.findUnique({
        where: { id, package_id },
        include: {
          package_trip_plan_images: true,
        },
      });

      if (!trip_plan) {
        return {
          success: false,
          message: 'Trip plan not found',
        };
      }
      await this.prisma.packageTripPlan.delete({
        where: { id: id, package_id: package_id },
      });

      // delete trip plan images from storage
      if (
        trip_plan.package_trip_plan_images &&
        trip_plan.package_trip_plan_images.length > 0
      ) {
        for (const image of trip_plan.package_trip_plan_images) {
          await SojebStorage.delete(
            appConfig().storageUrl.package + image.image,
          );
        }

        await this.prisma.packageTripPlanImage.deleteMany({
          where: { package_trip_plan_id: trip_plan.id },
        });
      }

      return {
        success: true,
        message: 'Trip plan deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
