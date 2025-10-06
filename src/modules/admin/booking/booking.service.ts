import { Injectable } from '@nestjs/common';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { SojebStorage } from '../../../common/lib/Disk/SojebStorage';
import appConfig from '../../../config/app.config';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async findAll({
    q,
    status = null,
    approve,
    type,
    date_range,
    page,
    limit,
    sort_by,
  }: {
    q?: string;
    status?: number;
    approve?: string;
    type?: string;
    date_range?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
  }) {
    // Ensure proper default values
    const pageNumber = page || 1;
    const limitNumber = limit || 10;
    const sortBy = sort_by || 'created_at_desc';
    try {
      const where_condition = {};
      
      // search using q
      if (q) {
        where_condition['OR'] = [
          { invoice_number: { contains: q, mode: 'insensitive' } },
          { user: { name: { contains: q, mode: 'insensitive' } } },
        ];
      }

      if (status) {
        where_condition['status'] = Number(status);
      }

      if (approve) {
        if (approve === 'approved') {
          where_condition['approved_at'] = { not: null };
        } else {
          where_condition['approved_at'] = null;
        }
      }

      // filter by type
      if (type && type !== 'all') {
        where_condition['type'] = type;
      }
      // If type is 'all' or not provided, don't filter by type (show all types)

      // filter by date range
      if (date_range && date_range !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (date_range) {
          case 'last_7_days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'last_30_days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'last_90_days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // default to 30 days
        }
        
        where_condition['created_at'] = {
          gte: startDate,
        };
      }

      // Calculate pagination
      const skip = (pageNumber - 1) * limitNumber;
      
      // Determine sort order
      let orderBy = {};
      switch (sortBy) {
        case 'created_at_asc':
          orderBy = { created_at: 'asc' };
          break;
        case 'created_at_desc':
          orderBy = { created_at: 'desc' };
          break;
        case 'total_amount_desc':
          orderBy = { total_amount: 'desc' };
          break;
        case 'total_amount_asc':
          orderBy = { total_amount: 'asc' };
          break;
        case 'booking_id_asc':
          orderBy = { invoice_number: 'asc' };
          break;
        case 'booking_id_desc':
          orderBy = { invoice_number: 'desc' };
          break;
        case 'name_asc':
          orderBy = { user: { name: 'asc' } };
          break;
        case 'name_desc':
          orderBy = { user: { name: 'desc' } };
          break;
        default:
          orderBy = { created_at: 'desc' };
      }

      // Get total count for pagination
      const totalCount = await this.prisma.booking.count({
        where: where_condition,
      });

      const bookings = await this.prisma.booking.findMany({
        where: {
          ...where_condition,
        },
        orderBy,
        skip,
        take: limitNumber,
        select: {
          id: true,
          invoice_number: true,
          email: true,
          phone_number: true,
          address1: true,
          address2: true,
          city: true,
          state: true,
          zip_code: true,
          country: true,
          total_amount: true,
          status: true,
          type: true,
          payment_status: true,
          approved_at: true,
          booking_items: {
            select: {
              start_date: true,
              end_date: true,
              package: {
                select: {
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          created_at: true,
          updated_at: true,
        },
      });
      console.log(bookings);
      // Format the bookings data to match UI requirements
      const formattedBookings = bookings.map(booking => {
        // Get check-in and check-out dates from booking items
        const checkInDate = booking.booking_items?.[0]?.start_date;
        const checkOutDate = booking.booking_items?.[0]?.end_date;
        
        // Format service type for display
        let serviceType = 'N/A';
        if (booking.type) {
          switch (booking.type.toLowerCase()) {
            case 'hotel':
              serviceType = 'Hotel';
              break;
            case 'apartment':
              serviceType = 'Apartment';
              break;
            case 'tour':
              serviceType = 'Tour';
              break;
            default:
              serviceType = booking.type.charAt(0).toUpperCase() + booking.type.slice(1);
          }
        }
        
        // Format payment status for display
        let paymentStatusDisplay = 'Pending';
        let paymentStatusColor = 'orange';
        
        if (booking.payment_status === 'approved' || booking.payment_status === 'paid') {
          paymentStatusDisplay = 'Full Paid';
          paymentStatusColor = 'green';
        } else if (booking.payment_status === 'canceled' || booking.payment_status === 'cancelled') {
          paymentStatusDisplay = 'Canceled';
          paymentStatusColor = 'red';
        } else if (booking.payment_status === 'pending') {
          paymentStatusDisplay = 'Pending';
          paymentStatusColor = 'orange';
        }
        
        // Format booking status for display
        let statusDisplay = booking.status || 'Pending';
        let statusColor = 'orange';
        
        if (booking.status === 'confirmed' || booking.status === 'approved') {
          statusDisplay = 'Confirmed';
          statusColor = 'green';
        } else if (booking.status === 'canceled' || booking.status === 'cancelled') {
          statusDisplay = 'Canceled';
          statusColor = 'red';
        } else if (booking.status === 'pending') {
          statusDisplay = 'Pending';
          statusColor = 'orange';
        }
        
        // Format amount for display
        const amountDisplay = booking.total_amount ? `$${Number(booking.total_amount).toLocaleString()}` : '$0';
        
        // Format dates for display
        const formatDate = (date: Date | string | null) => {
          if (!date) return 'N/A';
          const dateObj = new Date(date);
          return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
        };

        return {
          id: booking.id,
          booking_id: booking.invoice_number || `#${booking.id.slice(-5)}`, // Use invoice_number or fallback to last 5 chars of ID
          name: booking.user?.name || 'N/A',
          services: serviceType,
          payment: {
            status: paymentStatusDisplay,
            color: paymentStatusColor
          },
          check_in: formatDate(checkInDate),
          check_out: formatDate(checkOutDate),
          amount: amountDisplay,
          status: {
            text: statusDisplay,
            color: statusColor
          },
          // Keep original data for backend processing
          original_data: {
            id: booking.id,
            invoice_number: booking.invoice_number,
            email: booking.email,
            phone_number: booking.phone_number,
            address1: booking.address1,
            address2: booking.address2,
            city: booking.city,
            state: booking.state,
            zip_code: booking.zip_code,
            country: booking.country,
            total_amount: booking.total_amount,
            status: booking.status,
            type: booking.type,
            payment_status: booking.payment_status,
            approved_at: booking.approved_at,
            user: booking.user,
            booking_items: booking.booking_items,
            created_at: booking.created_at,
            updated_at: booking.updated_at,
          }
        };
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPreviousPage = pageNumber > 1;

      const paginationData = {
        current_page: pageNumber,
        total_pages: totalPages,
        total_items: totalCount,
        items_per_page: limitNumber,
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage,
      };



      return {
        success: true,
        data: formattedBookings,
        pagination: paginationData,
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
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        select: {
          id: true,
          invoice_number: true,
          status: true,
          vendor_id: true,
          user_id: true,
          type: true,
          total_amount: true,
          payment_status: true,
          payment_raw_status: true,
          paid_amount: true,
          paid_currency: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          address1: true,
          address2: true,
          city: true,
          state: true,
          zip_code: true,
          country: true,
          comments: true,
          created_at: true,
          updated_at: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phone_number: true,
            },
          },
          booking_items: {
            select: {
              id: true,
              start_date: true,
              end_date: true,
              quantity: true,
              price: true,
              package: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  type: true,
                  description: true,
                  package_files: {
                    where: {
                      deleted_at: null,
                      status: 1,
                    },
                    select: {
                      id: true,
                      file: true,
                      file_alt: true,
                      type: true,
                      is_featured: true,
                      sort_order: true,
                    },
                    orderBy: {
                      sort_order: 'asc',
                    },
                  },
                },
              },
            },
          },
          booking_extra_services: {
            select: {
              id: true,
              price: true,
              extra_service: {
                select: {
                  name: true,
                  description: true,
                  price: true,
                },
              },
            },
          },
          booking_travellers: {
            select: {
              id: true,
              full_name: true,
              first_name: true,
              last_name: true,
              type: true,
              gender: true,
              email: true,
              phone_number: true,
            },
          },
          booking_coupons: {
            select: {
              id: true,
              code: true,
              amount: true,
              amount_type: true,
              coupon: {
                select: {
                  name: true,
                  description: true,
                },
              },
            },
          },
          payment_transactions: {
            select: {
              id: true,
              amount: true,
              currency: true,
              paid_amount: true,
              paid_currency: true,
              status: true,
              provider: true,
              reference_number: true,
              created_at: true,
            },
          },
        },
      });

      if (!booking) {
        return {
          success: false,
          message: 'Booking not found',
        };
      }

      // Format the response to match the UI requirements
      const formattedBooking = {
        // Basic booking info
        id: booking.id,
        invoice_number: booking.invoice_number,
        status: booking.status,
        type: booking.type,
        total_amount: booking.total_amount,
        payment_status: booking.payment_status,
        created_at: booking.created_at,
        updated_at: booking.updated_at,

        // Package information (for the left side of the card)
        package: booking.booking_items?.[0]?.package ? {
          id: booking.booking_items[0].package.id,
          name: booking.booking_items[0].package.name,
          price: booking.booking_items[0].package.price,
          type: booking.booking_items[0].package.type,
          description: booking.booking_items[0].package.description,
          images: booking.booking_items[0].package.package_files?.map(file => ({
            id: file.id,
            url: file.file ? SojebStorage.url(
              appConfig().storageUrl.package + file.file,
            ) : null,
            alt: file.file_alt,
            type: file.type,
            is_featured: file.is_featured,
            sort_order: file.sort_order,
          })) || [],
          featured_image: booking.booking_items[0].package.package_files?.find(file => file.is_featured) ? {
            url: SojebStorage.url(
              appConfig().storageUrl.package + booking.booking_items[0].package.package_files.find(file => file.is_featured).file,
            ),
            alt: booking.booking_items[0].package.package_files.find(file => file.is_featured).file_alt,
          } : booking.booking_items[0].package.package_files?.[0] ? {
            url: SojebStorage.url(
              appConfig().storageUrl.package + booking.booking_items[0].package.package_files[0].file,
            ),
            alt: booking.booking_items[0].package.package_files[0].file_alt,
          } : null,
        } : null,

        // Guest information (for the right side of the card)
        guest: {
          id: booking.user?.id,
          name: booking.user?.name || `${booking.first_name || ''} ${booking.last_name || ''}`.trim(),
          email: booking.user?.email || booking.email,
          phone: booking.user?.phone_number || booking.phone_number,
          avatar: booking.user?.avatar ? {
            url: SojebStorage.url(
              appConfig().storageUrl.avatar + booking.user.avatar,
            ),
            alt: booking.user.name,
          } : null,
        },

        // Reservation details
        reservation_details: {
          guest_name: booking.user?.name || `${booking.first_name || ''} ${booking.last_name || ''}`.trim(),
          reservation_id: booking.invoice_number || `#${booking.id.slice(-5)}`,
          guests: booking.booking_travellers?.length || 1,
          check_in: booking.booking_items?.[0]?.start_date,
          check_out: booking.booking_items?.[0]?.end_date,
          status: this.formatStatus(booking.status),
          payment: this.formatPaymentStatus(booking.payment_status),
        },

        // Additional details
        booking_items: booking.booking_items?.map(item => ({
          id: item.id,
          start_date: item.start_date,
          end_date: item.end_date,
          quantity: item.quantity,
          price: item.price,
          package: item.package ? {
            ...item.package,
            images: item.package.package_files?.map(file => ({
              id: file.id,
              url: file.file ? SojebStorage.url(
                appConfig().storageUrl.package + file.file,
              ) : null,
              alt: file.file_alt,
              type: file.type,
              is_featured: file.is_featured,
              sort_order: file.sort_order,
            })) || [],
            featured_image: item.package.package_files?.find(file => file.is_featured) ? {
              url: SojebStorage.url(
                appConfig().storageUrl.package + item.package.package_files.find(file => file.is_featured).file,
              ),
              alt: item.package.package_files.find(file => file.is_featured).file_alt,
            } : item.package.package_files?.[0] ? {
              url: SojebStorage.url(
                appConfig().storageUrl.package + item.package.package_files[0].file,
              ),
              alt: item.package.package_files[0].file_alt,
            } : null,
          } : null,
        })) || [],

        booking_travellers: booking.booking_travellers?.map(traveller => ({
          id: traveller.id,
          full_name: traveller.full_name,
          first_name: traveller.first_name,
          last_name: traveller.last_name,
          type: traveller.type,
          gender: traveller.gender,
          email: traveller.email,
          phone_number: traveller.phone_number,
        })) || [],

        booking_extra_services: booking.booking_extra_services?.map(service => ({
          id: service.id,
          name: service.extra_service?.name,
          description: service.extra_service?.description,
          price: service.price,
        })) || [],

        booking_coupons: booking.booking_coupons?.map(coupon => ({
          id: coupon.id,
          code: coupon.code,
          name: coupon.coupon?.name,
          description: coupon.coupon?.description,
          amount: coupon.amount,
          amount_type: coupon.amount_type,
        })) || [],

        payment_transactions: booking.payment_transactions?.map(transaction => ({
          id: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency,
          paid_amount: transaction.paid_amount,
          paid_currency: transaction.paid_currency,
          status: transaction.status,
          provider: transaction.provider,
          reference_number: transaction.reference_number,
          created_at: transaction.created_at,
        })) || [],

        // Contact information
        contact: {
          first_name: booking.first_name,
          last_name: booking.last_name,
          email: booking.email,
          phone_number: booking.phone_number,
          address1: booking.address1,
          address2: booking.address2,
          city: booking.city,
          state: booking.state,
          zip_code: booking.zip_code,
          country: booking.country,
        },

        // Comments
        comments: booking.comments,
      };

      return {
        success: true,
        data: formattedBooking,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  private formatStatus(status: string): string {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'approved':
        return 'Confirmed';
      case 'canceled':
      case 'cancelled':
        return 'Canceled';
      case 'pending':
        return 'Pending';
      default:
        return status || 'Pending';
    }
  }

  private formatPaymentStatus(paymentStatus: string): string {
    switch (paymentStatus?.toLowerCase()) {
      case 'approved':
      case 'paid':
        return 'Completed';
      case 'canceled':
      case 'cancelled':
        return 'Canceled';
      case 'pending':
        return 'Pending';
      default:
        return paymentStatus || 'Pending';
    }
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    try {
      // check if exists
      const existBooking = await this.prisma.booking.findUnique({
        where: { id },
      });
      if (!existBooking) {
        return {
          success: false,
          message: 'Booking not found',
        };
      }

      // Prepare update data
      const updateData: any = { ...updateBookingDto };

      // Handle payment_status based on status changes
      if (updateBookingDto.status) {
        const status = updateBookingDto.status.toLowerCase();
        console.log(`Updating booking ${id} status from ${existBooking.status} to ${status}`);
        
        switch (status) {
          case 'canceled':
          case 'cancelled':
            updateData.payment_status = 'canceled';
            console.log(`Setting payment_status to 'canceled' for status: ${status}`);
            break;
          case 'approved':
            updateData.payment_status = 'approved';
            console.log(`Setting payment_status to 'approved' for status: ${status}`);
            break;
          case 'pending':
          case 'confirmed':
          case 'completed':
          case 'processing':
          case 'active':
          case 'in_progress':
          default:
            // Keep existing payment_status or set to pending if not set
            if (!updateData.payment_status) {
              updateData.payment_status = 'pending';
              console.log(`Setting payment_status to 'pending' for status: ${status}`);
            } else {
              console.log(`Keeping existing payment_status: ${updateData.payment_status} for status: ${status}`);
            }
            break;
        }
      }

      const booking = await this.prisma.booking.update({
        where: { id },
        data: updateData,
      });

      return {
        success: true,
        data: booking,
        message: `Booking updated successfully. Status: ${booking.status}, Payment Status: ${booking.payment_status}`,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async updateStatus(id: string, updateBookingDto: UpdateBookingDto) {
    try {
      // check if exists
      const existBooking = await this.prisma.booking.findUnique({
        where: { id },
      });
      if (!existBooking) {
        return {
          success: false,
          message: 'Booking not found',
        };
      }

      // Prepare update data
      const updateData: any = { ...updateBookingDto };

      // Handle payment_status based on status changes
      if (updateBookingDto.status) {
        const status = updateBookingDto.status.toLowerCase();
        console.log(`Updating booking ${id} status from ${existBooking.status} to ${status}`);
        
        switch (status) {
          case 'canceled':
          case 'cancelled':
            updateData.payment_status = 'canceled';
            console.log(`Setting payment_status to 'canceled' for status: ${status}`);
            break;
          case 'approved':
            updateData.payment_status = 'approved';
            console.log(`Setting payment_status to 'approved' for status: ${status}`);
            break;
          case 'pending':
          case 'confirmed':
          case 'completed':
          case 'processing':
          case 'active':
          case 'in_progress':
          default:
            // Keep existing payment_status or set to pending if not set
            if (!updateData.payment_status) {
              updateData.payment_status = 'pending';
              console.log(`Setting payment_status to 'pending' for status: ${status}`);
            } else {
              console.log(`Keeping existing payment_status: ${updateData.payment_status} for status: ${status}`);
            }
            break;
        }
      }

      const booking = await this.prisma.booking.update({
        where: { id },
        data: updateData,
      });

      // send notification
      // await NotificationRepository.createNotification({
      //   sender_id: booking.user_id,
      //   receiver_id: booking.vendor_id,
      //   text: 'Your booking has been updated',
      //   type: 'booking',
      // });

      return {
        success: true,
        message: `Booking status updated successfully. Status: ${booking.status}, Payment Status: ${booking.payment_status}`,
        data: booking,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async getBookingStatistics() {
    try {
      // Get total count
      const totalCount = await this.prisma.booking.count();

      // Get count by type
      const hotelCount = await this.prisma.booking.count({
        where: {
          type: 'hotel',
        },
      });

      const apartmentCount = await this.prisma.booking.count({
        where: {
          type: 'apartment',
        },
      });

      const tourCount = await this.prisma.booking.count({
        where: {
          type: 'tour',
        },
      });

      return {
        success: true,
        data: {
          all: totalCount,
          hotel: hotelCount,
          apartment: apartmentCount,
          tour: tourCount,
        },
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
      const booking = await this.prisma.booking.delete({
        where: { id },
      });

      return {
        success: true,
        data: booking,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  async completeBooking(id: string) {
    try {
      // Check if booking exists
      const existingBooking = await this.prisma.booking.findUnique({
        where: { id },
        select: {
          id: true,
          invoice_number: true,
          status: true,
          payment_status: true,
          user_id: true,
          vendor_id: true,
          total_amount: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!existingBooking) {
        return {
          success: false,
          message: 'Booking not found',
        };
      }

      // Validate that booking is in pending status
      if (existingBooking.status !== 'pending') {
        return {
          success: false,
          message: `Cannot complete booking. Current status is "${existingBooking.status}". Only pending bookings can be completed.`,
          data: {
            booking_id: id,
            current_status: existingBooking.status,
            required_status: 'pending',
          },
        };
      }

      // Update booking status to completed and payment status to approved
      const updatedBooking = await this.prisma.booking.update({
        where: { id },
        data: {
          status: 'completed',
          payment_status: 'approved',
          approved_at: new Date(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          invoice_number: true,
          status: true,
          payment_status: true,
          approved_at: true,
          total_amount: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          booking_items: {
            select: {
              id: true,
              start_date: true,
              end_date: true,
              quantity: true,
              price: true,
              package: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          },
        },
      });

      // Log the completion for audit trail
      console.log(`Booking ${id} (${existingBooking.invoice_number}) completed by admin:`, {
        previous_status: existingBooking.status,
        new_status: 'completed',
        previous_payment_status: existingBooking.payment_status,
        new_payment_status: 'approved',
        completed_at: new Date(),
        user: existingBooking.user?.name || existingBooking.user?.email,
        vendor: existingBooking.vendor?.name || existingBooking.vendor?.email,
        total_amount: existingBooking.total_amount,
      });

      return {
        success: true,
        message: 'Booking completed successfully',
        data: {
          ...updatedBooking,
          completion_details: {
            completed_at: updatedBooking.approved_at,
            previous_status: existingBooking.status,
            new_status: updatedBooking.status,
            previous_payment_status: existingBooking.payment_status,
            new_payment_status: updatedBooking.payment_status,
          },
        },
      };
    } catch (error) {
      console.error('Error completing booking:', error);
      return {
        success: false,
        message: `Failed to complete booking: ${error.message}`,
      };
    }
  }

  async completeMultipleBookings(bookingIds: string[]) {
    try {
      if (!bookingIds || bookingIds.length === 0) {
        return {
          success: false,
          message: 'No booking IDs provided',
        };
      }

      // Check if all bookings exist and are pending
      const existingBookings = await this.prisma.booking.findMany({
        where: {
          id: { in: bookingIds },
        },
        select: {
          id: true,
          invoice_number: true,
          status: true,
          payment_status: true,
          user_id: true,
          vendor_id: true,
          total_amount: true,
        },
      });

      if (existingBookings.length === 0) {
        return {
          success: false,
          message: 'No bookings found with the provided IDs',
        };
      }

      // Check for non-pending bookings
      const nonPendingBookings = existingBookings.filter(booking => booking.status !== 'pending');
      if (nonPendingBookings.length > 0) {
        return {
          success: false,
          message: 'Some bookings cannot be completed because they are not in pending status',
          data: {
            non_pending_bookings: nonPendingBookings.map(booking => ({
              id: booking.id,
              invoice_number: booking.invoice_number,
              current_status: booking.status,
            })),
            total_provided: bookingIds.length,
            total_found: existingBookings.length,
            pending_count: existingBookings.length - nonPendingBookings.length,
          },
        };
      }

      // Update all pending bookings to completed
      const updateResult = await this.prisma.booking.updateMany({
        where: {
          id: { in: bookingIds },
          status: 'pending',
        },
        data: {
          status: 'completed',
          payment_status: 'approved',
          approved_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Get updated bookings for response
      const updatedBookings = await this.prisma.booking.findMany({
        where: {
          id: { in: bookingIds },
        },
        select: {
          id: true,
          invoice_number: true,
          status: true,
          payment_status: true,
          approved_at: true,
          total_amount: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Log the bulk completion for audit trail
      console.log(`Bulk booking completion by admin:`, {
        completed_count: updateResult.count,
        booking_ids: bookingIds,
        completed_at: new Date(),
        bookings: updatedBookings.map(booking => ({
          id: booking.id,
          invoice_number: booking.invoice_number,
          user: booking.user?.name || booking.user?.email,
          vendor: booking.vendor?.name || booking.vendor?.email,
          total_amount: booking.total_amount,
        })),
      });

      return {
        success: true,
        message: `Successfully completed ${updateResult.count} booking(s)`,
        data: {
          completed_count: updateResult.count,
          total_requested: bookingIds.length,
          completed_bookings: updatedBookings,
          completion_details: {
            completed_at: new Date(),
            previous_status: 'pending',
            new_status: 'completed',
            previous_payment_status: 'pending',
            new_payment_status: 'approved',
          },
        },
      };
    } catch (error) {
      console.error('Error completing multiple bookings:', error);
      return {
        success: false,
        message: `Failed to complete bookings: ${error.message}`,
      };
    }
  }
}
