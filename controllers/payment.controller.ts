import { Request, Response, NextFunction } from "express";
import { IPaymentService } from "../interfaces/services/IPaymentService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";

export class PaymentController {
  private  _paymentService: IPaymentService;
  constructor(paymentService: IPaymentService) {
    this._paymentService = paymentService;
  }

  createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { bookingId } = req.body;
      const result = await this._paymentService.createCheckoutSession(userId, bookingId);

      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(result, SUCCESS_MESSAGES.CHECKOUT_SESSION_CREATED)
      );
    } catch (error) {
      next(error);
    }
  };

  verifyAndFinalizePayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, bookingId } = req.body;
      const result = await this._paymentService.verifyAndFinalizePayment(sessionId, bookingId);

      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(
          { booking: result.booking, alreadyProcessed: result.alreadyProcessed },
          result.message
        )
      );
    } catch (error) {
      next(error);
    }
  };

  handleStripeWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this._paymentService.handleWebhookEvent(req.body);
      res.status(HttpStatusCode.OK).send(SUCCESS_MESSAGES.WEBHOOK_RECEIVED);
    } catch (error) {
      next(error);
    }
  };

  payWithWallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { bookingId } = req.body;
      
      await this._paymentService.payWithWallet(userId, bookingId);

      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null, "Wallet payment processed successfully")
      );
    } catch (error) {
      next(error);
    }
  };
}