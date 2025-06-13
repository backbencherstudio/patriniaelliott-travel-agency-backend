import { Injectable } from '@nestjs/common';
import { CreateTravellerTypeDto } from './dto/create-traveller-type.dto';
import { UpdateTravellerTypeDto } from './dto/update-traveller-type.dto';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TravellerTypeService {
  constructor(private prisma: PrismaService) {}

  async create(createTravellerTypeDto: CreateTravellerTypeDto) {
    try {
      await this.prisma.travellerType.create({
        data: createTravellerTypeDto,
      });

      return {
        success: true,
        message: 'TravellerType created successfully',
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
      const travellerTypes = await this.prisma.travellerType.findMany({
        select: {
          id: true,
          type: true,
        },
      });

      return {
        success: true,
        data: travellerTypes,
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
      const travellerType = await this.prisma.travellerType.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          type: true,
        },
      });

      if (!travellerType) {
        return {
          success: false,
          message: 'TravellerType not found',
        };
      }

      return {
        success: true,
        data: travellerType,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async update(id: string, updateTravellerTypeDto: UpdateTravellerTypeDto) {
    try {
      const travellerType = await this.prisma.travellerType.findUnique({
        where: {
          id: id,
        },
      });

      if (!travellerType) {
        return {
          success: false,
          message: 'TravellerType not found',
        };
      }

      await this.prisma.travellerType.update({
        where: {
          id: id,
        },
        data: updateTravellerTypeDto,
      });

      return {
        success: true,
        message: 'TravellerType updated successfully',
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
      const travellerType = await this.prisma.travellerType.findUnique({
        where: {
          id: id,
        },
      });

      if (!travellerType) {
        return {
          success: false,
          message: 'TravellerType not found',
        };
      }

      await this.prisma.travellerType.delete({
        where: {
          id: id,
        },
      });

      return {
        success: true,
        message: 'TravellerType deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
