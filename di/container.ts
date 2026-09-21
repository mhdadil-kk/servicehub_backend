
import { AuthRepository }                 from "../repositories/auth.repository";
import { OTPRepository }                  from "../repositories/otp.repository";
import { BookingRepository }              from "../repositories/booking.repository";
import { ProviderProfileRepository }      from "../repositories/providerProfile.repository";
import { ProviderAvailabilityRepository } from "../repositories/providerAvailability.repository";
import { ConversationRepository }         from "../repositories/conversation.repository";
import { MessageRepository }              from "../repositories/message.repository";
import { NotificationRepository }         from "../repositories/notification.repository";
import { TransactionRepository }          from "../repositories/transaction.repository";
import { WalletRepository }               from "../repositories/wallet.repository";
import { ServiceRepository }              from "../repositories/service.repository";
import { ReviewRepository }               from "../repositories/review.repository";
import { ReportRepository }               from "../repositories/report.repository";
import { AddressRepository }              from "../repositories/address.repository";

import { Mailer }             from "../utils/mailer";
import { StripePaymentGateway } from "../gateways/stripe.gateway";
import { env } from "../config/env";

import { AuthService }         from "../services/auth.service";
import { BookingService }      from "../services/booking.service";
import { BookingQueryService } from "../services/booking/booking-query.service";
import { BookingLifecycleService } from "../services/booking/booking-lifecycle.service";
import { BookingOtpService }   from "../services/booking/booking-otp.service";
import { ChatService }         from "../services/chat.service";
import { AdminService }        from "../services/admin.service";
import { NotificationService } from "../services/notification.service";
import { WalletService }       from "../services/wallet.service";
import { PaymentService }      from "../services/payment.service";
import { ProviderService }     from "../services/provider.service";
import { ReviewService }       from "../services/review.service";
import { ReportService }       from "../services/report.service";
import { AddressService }      from "../services/address.service";
import { ServiceService }      from "../services/service.service";
import { DashboardService }    from "../services/dashboard.service";

export const userRepository                 = new AuthRepository();
export const otpRepository                  = new OTPRepository();
export const bookingRepository              = new BookingRepository();
export const providerProfileRepository      = new ProviderProfileRepository();
export const providerAvailabilityRepository = new ProviderAvailabilityRepository();
export const conversationRepository         = new ConversationRepository();
export const messageRepository              = new MessageRepository();
export const notificationRepository         = new NotificationRepository();
export const transactionRepository          = new TransactionRepository();
export const walletRepository               = new WalletRepository();
export const serviceRepository              = new ServiceRepository();
export const reviewRepository               = new ReviewRepository();
export const reportRepository               = new ReportRepository();
export const addressRepository              = new AddressRepository();

export const mailer = new Mailer();
export const paymentGateway = new StripePaymentGateway(env.STRIPE_SECRET_KEY);

export const notificationService = new NotificationService(notificationRepository);

export const walletService = new WalletService(walletRepository, transactionRepository);

export const authService = new AuthService(userRepository, otpRepository, mailer);

export const bookingQueryService = new BookingQueryService(
  bookingRepository,
  providerProfileRepository,
  providerAvailabilityRepository
);

export const bookingLifecycleService = new BookingLifecycleService(
  bookingRepository,
  providerProfileRepository,
  conversationRepository,
  messageRepository,
  notificationService,
  walletService
);

export const bookingOtpService = new BookingOtpService(
  bookingRepository,
  providerProfileRepository,
  notificationService,
  mailer
);

export const bookingService = new BookingService(
  bookingQueryService,
  bookingLifecycleService,
  bookingOtpService
);

export const chatService = new ChatService(
  conversationRepository,
  messageRepository,
  providerProfileRepository,
  bookingRepository
);

export const adminService = new AdminService(
  userRepository,
  serviceRepository,
  providerProfileRepository,
  bookingRepository,
  transactionRepository,
  reportRepository
);

export const paymentService = new PaymentService(
  bookingRepository,
  transactionRepository,
  paymentGateway,
  walletService,
  providerProfileRepository
);

export const providerService   = new ProviderService(providerProfileRepository, providerAvailabilityRepository, userRepository);
export const reviewService     = new ReviewService(reviewRepository, bookingRepository, providerProfileRepository);
export const reportService     = new ReportService(reportRepository,userRepository,bookingRepository,notificationService);
export const addressService    = new AddressService(addressRepository);
export const serviceService    = new ServiceService(serviceRepository, userRepository, providerProfileRepository);
export const dashboardService  = new DashboardService(bookingRepository, transactionRepository, providerProfileRepository);
