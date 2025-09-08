import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class ContactUsService {
  constructor(private readonly mailService: MailService) {}

  async sendMessageToAdmin(createContactUsDto: CreateContactUsDto) {
    try {
      const {full_name, phone_number, email, topic, message} = createContactUsDto;
      
      if(!full_name || !phone_number || !email || !topic || !message){
        throw new HttpException('All fields are required', HttpStatus.BAD_REQUEST);
      }

      const admin = await this.mailService.sendEmailAdminContactUs(createContactUsDto);
      
      return {
        success: true,
        message: 'Message sent to admin successfully'
      };
      
    } catch (error) {
      if(error instanceof HttpException){
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
