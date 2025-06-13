import { Injectable } from '@nestjs/common';
import { CreateExtraServiceDto } from './dto/create-extra-service.dto';
import { UpdateExtraServiceDto } from './dto/update-extra-service.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { DateHelper } from '../../../common/helper/date.helper';

@Injectable()
export class ExtraServiceService {
  constructor(private prisma: PrismaService) {}

  async create(createExtraServiceDto: CreateExtraServiceDto) {
    try {
      const data: any = {};
      if (createExtraServiceDto.name) {
        data.name = createExtraServiceDto.name;
      }
      if (createExtraServiceDto.description) {
        data.description = createExtraServiceDto.description;
      }
      if (createExtraServiceDto.price) {
        data.price = Number(createExtraServiceDto.price);
      }
      await this.prisma.extraService.create({
        data: {
          ...data,
        },
      });

      return {
        success: true,
        message: 'Extra service created successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async findAll() {
    try {
      const extra_services = await this.prisma.extraService.findMany({
        select: {
          id: true,
          name: true,
          price: true,
        },
      });

      return {
        success: true,
        data: extra_services,
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
      const extra_service = await this.prisma.extraService.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          price: true,
          description: true,
        },
      });

      return {
        success: true,
        data: extra_service,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(id: string, updateExtraServiceDto: UpdateExtraServiceDto) {
    try {
      const data: any = {};
      if (updateExtraServiceDto.name) {
        data.name = updateExtraServiceDto.name;
      }
      if (updateExtraServiceDto.description) {
        data.description = updateExtraServiceDto.description;
      }
      if (updateExtraServiceDto.price) {
        data.price = updateExtraServiceDto.price;
      }
      await this.prisma.extraService.update({
        where: { id },
        data: {
          ...data,
          updated_at: DateHelper.now(),
        },
      });

      return {
        success: true,
        message: 'Extra service updated successfully',
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
      await this.prisma.extraService.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Extra service deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
