import { Request, Response } from "express";
import { IPaymentService } from "../interfaces/services/IPaymentService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { PaymentMapper } from "../mappers/payment.mapper";
import { asyncHandler } from "../utils/async-handler";


export class PaymentController {
  constructor(private _paymentService: IPaymentService) {}

  createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { bookingId } = req.body;
    const result = await this._paymentService.createCheckoutSession(userId, bookingId);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(PaymentMapper.toCheckoutResponse(result), SUCCESS_MESSAGES.CHECKOUT_SESSION_CREATED)
    );
  });

  verifyAndFinalizePayment = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, bookingId } = req.body;
    const result = await this._paymentService.verifyAndFinalizePayment(sessionId, bookingId);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(
        PaymentMapper.toWebhookResponse(result),
        result.message
      )
    );
  });

  handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
    await this._paymentService.handleWebhookEvent(req.body);
    res.status(HttpStatusCode.OK).send(SUCCESS_MESSAGES.WEBHOOK_RECEIVED);
  });

  payWithWallet = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { bookingId } = req.body;
    
    await this._paymentService.payWithWallet(userId, bookingId);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(null, "Wallet payment processed successfully")
    );
  });
}