import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import appConfig from '../config/app.config';
import { CreateContactUsDto } from 'src/modules/contact-us/dto/create-contact-us.dto';

@Injectable()
export class MailService {
  static sendEmailToAdmin(createContactUsDto: CreateContactUsDto) {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectQueue('mail-queue') private queue: Queue,
    private mailerService: MailerService,
  ) {}

  async sendMemberInvitation({ user, member, url }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subject = `${user.fname} is inviting you to ${appConfig().app.name}`;

      // add to queue
      await this.queue.add('sendMemberInvitation', {
        to: member.email,
        from: from,
        subject: subject,
        template: 'member-invitation',
        context: {
          user: user,
          member: member,
          url: url,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  // send otp code for email verification
  async sendOtpCodeToEmail({ name, email, otp }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subject = 'Email Verification';

      // add to queue
      await this.queue.add('sendOtpCodeToEmail', {
        to: email,
        from: from,
        subject: subject,
        template: 'email-verification',
        context: {
          name: name,
          otp: otp,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
  

  async sendVerificationLink(params: {
    email: string;
    name: string;
    token: string;
    type: string;
  }) {
    try {
      const verificationLink = `${appConfig().app.client_app_url}/verify-email?token=${params.token}&email=${params.email}&type=${params.type}`;

      // add to queue
      await this.queue.add('sendVerificationLink', {
        to: params.email,
        subject: 'Verify Your Email',
        template: './verification-link',
        context: {
          name: params.name,
          verificationLink,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async sendEmailAdminContactUs(createContactUsDto: CreateContactUsDto) {
    try {
        const form = `${createContactUsDto.full_name} <${createContactUsDto.email}>`;
        const to = appConfig().mail.from;
        const subject = 'New Contact Us Message';
        const template = 'contact-us';
        const context = {
          full_name: createContactUsDto.full_name,
          phone_number: createContactUsDto.phone_number,
          email: createContactUsDto.email,
          topic: createContactUsDto.topic,
          message: createContactUsDto.message,
        }

        // console.log(form, to, subject, template, context);

        await this.queue.add('sendEmailToAdmin', {
          to: to,
          from: form,
          subject: subject,
          template: template,
          context: context,
        });
    } catch (error) {
      console.log(error);
    }
  }
}
