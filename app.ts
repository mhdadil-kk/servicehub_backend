import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import serviceRoutes from "./routes/service.routes";
import providerRoutes from "./routes/provider.routes";
import providersRoutes from "./routes/providers.routes";
import addressRoutes from "./routes/address.routes";
import bookingRoutes from "./routes/booking.routes";
import chatRoutes from "./routes/chat.routes";
import paymentRoutes from "./routes/payment.routes";
import reviewRoutes from "./routes/review.routes";
import notificationRoutes from "./routes/notification.routes";
import walletRoutes from "./routes/wallet.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import reportRoutes from "./routes/report.routes";
import { globalErrorHandler } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { ROUTES } from "./constants/routes";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use(express.json());
app.use(requestLogger);

app.use(ROUTES.AUTH.BASE, authRoutes);
app.use(ROUTES.ADMIN.BASE, adminRoutes);
app.use(ROUTES.SERVICES.BASE, serviceRoutes);
app.use(ROUTES.PROVIDER.BASE, providerRoutes);
app.use(ROUTES.PROVIDERS.BASE, providersRoutes);
app.use(ROUTES.ADDRESS.BASE, addressRoutes);
app.use(ROUTES.BOOKINGS.BASE, bookingRoutes);
app.use(ROUTES.CHAT.BASE, chatRoutes);
app.use(ROUTES.PAYMENTS.BASE, paymentRoutes);
app.use(ROUTES.NOTIFICATIONS.BASE, notificationRoutes);
app.use(ROUTES.WALLET.BASE, walletRoutes);
app.use(ROUTES.DASHBOARD.BASE, dashboardRoutes);
app.use(ROUTES.REVIEWS.BASE, reviewRoutes);
app.use(ROUTES.REPORTS.BASE, reportRoutes);

app.use(globalErrorHandler);

export default app;