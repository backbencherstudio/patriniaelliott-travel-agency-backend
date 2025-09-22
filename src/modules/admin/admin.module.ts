import { Module } from '@nestjs/common';
import { FaqModule } from './faq/faq.module';
import { PackageModule } from './package/package.module';
import { CategoryModule } from './category/category.module';
import { TagModule } from './tag/tag.module';
import { PackageCancellationPolicyModule } from './package-cancellation-policy/package-cancellation-policy.module';
import { DestinationModule } from './destination/destination.module';
import { CountryModule } from './country/country.module';
import { BlogModule } from './blog/blog.module';
import { ContactModule } from './contact/contact.module';
import { SocialMediaModule } from './social-media/social-media.module';
import { WebsiteInfoModule } from './website-info/website-info.module';
import { ExtraServiceModule } from './extra-service/extra-service.module';
import { CouponModule } from './coupon/coupon.module';
import { LanguageModule } from './language/language.module';
import { TravellerTypeModule } from './traveller-type/traveller-type.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentTransactionModule } from './payment-transaction/payment-transaction.module';
import { UserModule } from './user-dashboard/user.module';
import { BookingModule } from './booking/booking.module';
import { NotificationModule } from './notification/notification.module';
import { DashboardModule } from './dashboard/dashboard.module';
import {VendorPackageModule} from './vendor-package/vendor-package.module';
import { VendorUserVerificationAdminModule } from './vendor-user-verification/vendor-user-verification.module';
import { ListingManagementModule } from './listing-management/listing-management.module';
import { PaymentsModule } from './payments/payments.module';
@Module({
  imports: [
    FaqModule,
    PackageModule,
    CategoryModule,
    TagModule,
    PackageCancellationPolicyModule,
    DestinationModule,
    CountryModule,
    BlogModule,
    ContactModule,
    SocialMediaModule,
    WebsiteInfoModule,
    ExtraServiceModule,
    CouponModule,
    LanguageModule,
    TravellerTypeModule,
    ReviewsModule,
    PaymentTransactionModule,
    UserModule,
    BookingModule,
    NotificationModule,
    DashboardModule,
    VendorPackageModule,
    VendorUserVerificationAdminModule,
    ListingManagementModule,
    PaymentsModule,
  ],
})
export class AdminModule {}
