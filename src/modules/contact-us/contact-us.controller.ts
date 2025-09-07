import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ContactUsService } from './contact-us.service';
import { CreateContactUsDto } from './dto/create-contact-us.dto';
import { UpdateContactUsDto } from './dto/update-contact-us.dto';

@Controller('contact-us')
export class ContactUsController {
  constructor(private readonly contactUsService: ContactUsService) {}

  @Post()
  create(@Body() createContactUsDto: CreateContactUsDto) {
    // console.log("one",createContactUsDto);
    return this.contactUsService.sendMessageToAdmin(createContactUsDto);
  }

}
