import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationRepository {
  /**
   * Create a notification
   * @param sender_id - The ID of the user who fired the event
   * @param receiver_id - The ID of the user to notify
   * @param text - The text of the notification
   * @param type - The type of the notification
   * @param entity_id - The ID of the entity related to the notification
   * @returns The created notification
   */
  static async createNotification({
    sender_id,
    receiver_id,
    text,
    type,
    entity_id,
  }: {
    sender_id?: string;
    receiver_id?: string;
    text?: string;
    type?:
      | 'message'
      | 'comment'
      | 'review'
      | 'booking'
      | 'payment_transaction'
      | 'package'
      | 'blog';
    entity_id?: string;
  }) {
    const notificationEventData = {};
    if (type) {
      notificationEventData['type'] = type;
    }
    if (text) {
      notificationEventData['text'] = text;
    }
    const notificationEvent = await prisma.notificationEvent.create({
      data: {
        type: type,
        text: text,
        ...notificationEventData,
      },
    });

    const notificationData = {};
    if (sender_id) {
      notificationData['sender_id'] = sender_id;
    }
    if (receiver_id) {
      notificationData['receiver_id'] = receiver_id;
    }
    if (entity_id) {
      notificationData['entity_id'] = entity_id;
    }

    const notification = await prisma.notification.create({
      data: {
        notification_event_id: notificationEvent.id,
        ...notificationData,
      },
    });

    return notification;
  }

  /**
   * Create booking notifications for vendor and admin
   * @param booking_id - The ID of the booking
   * @param user_id - The ID of the user who made the booking
   * @param vendor_id - The ID of the vendor
   * @param admin_id - The ID of the admin (optional, null means all admins)
   * @returns The created notifications
   */
  static async createBookingNotification({
    booking_id,
    user_id,
    vendor_id,
    admin_id
  }: {
    booking_id: string;
    user_id: string;
    vendor_id: string;
    admin_id?: string;
  }) {
    const notifications = [];

    // Notify vendor about new booking
    const vendorNotification = await this.createNotification({
      sender_id: user_id,
      receiver_id: vendor_id,
      text: 'New booking received for your package',
      type: 'booking',
      entity_id: booking_id,
    });
    notifications.push(vendorNotification);

    // Notify admin about new booking
    const adminNotification = await this.createNotification({
      sender_id: user_id,
      receiver_id: admin_id || null, // null means all admins
      text: 'New booking created by user',
      type: 'booking',
      entity_id: booking_id,
    });
    notifications.push(adminNotification);

    return notifications;
  }

  /**
   * Create package notification for admin when vendor creates package
   * @param package_id - The ID of the package
   * @param vendor_id - The ID of the vendor
   * @param admin_id - The ID of the admin (optional, null means all admins)
   * @returns The created notification
   */
  static async createPackageNotification({
    package_id,
    vendor_id,
    admin_id
  }: {
    package_id: string;
    vendor_id: string;
    admin_id?: string;
  }) {
    return await this.createNotification({
      sender_id: vendor_id,
      receiver_id: admin_id || null,
      text: 'New package created by vendor, needs approval',
      type: 'package',
      entity_id: package_id,
    });
  }

  /**
   * Create feedback notifications for admin and vendor when user gives feedback
   * @param review_id - The ID of the review
   * @param package_id - The ID of the package
   * @param user_id - The ID of the user who gave feedback
   * @param vendor_id - The ID of the vendor
   * @param admin_id - The ID of the admin (optional, null means all admins)
   * @returns The created notifications
   */
  static async createFeedbackNotification({
    review_id,
    package_id,
    user_id,
    vendor_id,
    admin_id
  }: {
    review_id: string;
    package_id: string;
    user_id: string;
    vendor_id: string;
    admin_id?: string;
  }) {
    const notifications = [];

    // Notify admin about new feedback
    const adminNotification = await this.createNotification({
      sender_id: user_id,
      receiver_id: admin_id || null,
      text: 'New feedback received',
      type: 'review',
      entity_id: review_id,
    });
    notifications.push(adminNotification);

    // Notify vendor about new feedback
    const vendorNotification = await this.createNotification({
      sender_id: user_id,
      receiver_id: vendor_id,
      text: 'New feedback on your package',
      type: 'review',
      entity_id: review_id,
    });
    notifications.push(vendorNotification);

    return notifications;
  }
}
