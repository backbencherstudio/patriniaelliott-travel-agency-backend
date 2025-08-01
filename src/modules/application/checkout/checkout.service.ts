import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { InitiateCheckoutDto } from './dto/initiate-checkout.dto';

@Injectable()
export class CheckoutService {
  constructor(private readonly prisma: PrismaService) {}

  async initiateCheckout(userId: string, initiateCheckoutDto: InitiateCheckoutDto) {
    const { package_id, room_type_id, start_date, end_date, quantity, guests } = initiateCheckoutDto;

    // 1. Validate package exists and is approved
    const packageData = await this.prisma.package.findFirst({
      where: {
        id: package_id,
        status: 1, // Approved packages only
        deleted_at: null
      },
      include: {
        package_room_types: {
          where: {
            id: room_type_id,
            is_available: true,
            deleted_at: null
          }
        },
        package_availabilities: {
          where: {
            date: {
              gte: start_date,
              lt: end_date
            },
            status: 'available'
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            display_name: true
          }
        }
      }
    });

    if (!packageData) {
      throw new NotFoundException('Package not found or not available');
    }

    if (packageData.package_room_types.length === 0) {
      throw new BadRequestException('Selected room type not available');
    }

    const roomType = packageData.package_room_types[0];

    // 2. Validate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start_date < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    if (end_date <= start_date) {
      throw new BadRequestException('End date must be after start date');
    }

    // 3. Calculate nights
    const nights = Math.ceil((end_date.getTime() - start_date.getTime()) / (1000 * 60 * 60 * 24));

    if (nights < 1) {
      throw new BadRequestException('Minimum stay is 1 night');
    }

    // 4. Check availability for all dates
    const requiredDates = this.generateDateRange(start_date, end_date);
    const availableDates = packageData.package_availabilities.map(av => av.date.toISOString().split('T')[0]);
    
    const unavailableDates = requiredDates.filter(date => !availableDates.includes(date));
    if (unavailableDates.length > 0) {
      throw new BadRequestException(`Dates not available: ${unavailableDates.join(', ')}`);
    }

    // 5. Validate guest capacity
    const totalGuests = guests.adults + guests.children + guests.infants;
    if (totalGuests > roomType.max_guests * quantity) {
      throw new BadRequestException(`Maximum ${roomType.max_guests * quantity} guests allowed for ${quantity} room(s)`);
    }

    // 6. Calculate pricing
    const basePrice = parseFloat(roomType.price.toString());
    const subtotal = basePrice * nights * quantity;
    const taxRate = 0.10; // 10% tax - you can make this configurable
    const taxes = subtotal * taxRate;
    const total = subtotal + taxes;

    // 7. Create checkout session
    const checkoutSession = await this.prisma.checkout.create({
      data: {
        user_id: userId,
        vendor_id: packageData.user_id,
        status: 1, // Active checkout session
        // Add other checkout fields as needed
      }
    });

    // 8. Create checkout item
    const checkoutItem = await this.prisma.checkoutItem.create({
      data: {
        checkout_id: checkoutSession.id,
        package_id: package_id,
        start_date: start_date,
        end_date: end_date,
        included_packages: JSON.stringify({
          room_type_id: room_type_id,
          room_type_name: roomType.name,
          quantity: quantity,
          guests: guests
        })
      }
    });

    // 9. Set expiration time (15 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    return {
      success: true,
      data: {
        checkout_id: checkoutSession.id,
        package: {
          id: packageData.id,
          name: packageData.name,
          type: packageData.type,
          description: packageData.description
        },
        room_type: {
          id: roomType.id,
          name: roomType.name,
          description: roomType.description,
          price: roomType.price,
          max_guests: roomType.max_guests
        },
        dates: {
          start_date: start_date,
          end_date: end_date,
          nights: nights
        },
        guests: {
          adults: guests.adults,
          children: guests.children,
          infants: guests.infants,
          total: totalGuests
        },
        pricing: {
          base_price: basePrice,
          nights: nights,
          quantity: quantity,
          subtotal: subtotal,
          taxes: taxes,
          total: total,
          currency: roomType.currency || 'USD'
        },
        availability: {
          available: true,
          reserved_until: expiresAt
        },
        expires_at: expiresAt
      },
      message: 'Checkout session created successfully'
    };
  }

  private generateDateRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  async getCheckoutSession(checkoutId: string, userId: string) {
    const checkout = await this.prisma.checkout.findFirst({
      where: {
        id: checkoutId,
        user_id: userId,
        status: 1
      },
      include: {
        checkout_items: {
          include: {
            package: {
              include: {
                package_room_types: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    display_name: true
                  }
                }
              }
            }
          }
        },
        checkout_travellers: true,
        checkout_extra_services: true
      }
    });

    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }

    return {
      success: true,
      data: checkout
    };
  }

  async cancelCheckoutSession(checkoutId: string, userId: string) {
    const checkout = await this.prisma.checkout.findFirst({
      where: {
        id: checkoutId,
        user_id: userId,
        status: 1
      }
    });

    if (!checkout) {
      throw new NotFoundException('Checkout session not found');
    }

    // Update checkout status to cancelled
    await this.prisma.checkout.update({
      where: { id: checkoutId },
      data: { status: 0 } // Cancelled
    });

    return {
      success: true,
      message: 'Checkout session cancelled successfully'
    };
  }
}
