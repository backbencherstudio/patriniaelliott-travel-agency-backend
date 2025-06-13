import { PrismaClient } from '@prisma/client';
import { StringHelper } from '../../helper/string.helper';

const prisma = new PrismaClient();

export class BookingRepository {
  /**
   * Create invoice number
   * @returns
   */
  static async createInvoiceNumber() {
    // create invoice number
    let invoice_number: string = '';
    const last_booking = await prisma.booking.findFirst({
      orderBy: {
        created_at: 'desc',
      },
    });
    if (last_booking) {
      const last_invoice_number = last_booking.invoice_number;
      const padLength = last_invoice_number.length;
      invoice_number = String(Number(last_invoice_number) + 1);
      // pad invoice number to 10 characters, example: 123 -> 0000000123
      invoice_number = StringHelper.strPad(
        invoice_number,
        padLength,
        '0',
        'right',
      );
    } else {
      invoice_number = StringHelper.strPad('1', 4, '0', 'right');
    }

    return invoice_number;
  }
}
