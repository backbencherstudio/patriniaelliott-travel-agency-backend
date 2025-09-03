import { Module } from '@nestjs/common';
import { ContactUsService } from './contact-us.service';
import { ContactUsController } from './contact-us.controller';

@Module({
  controllers: [ContactUsController],
  providers: [ContactUsService],
})
export class ContactUsModule {}
