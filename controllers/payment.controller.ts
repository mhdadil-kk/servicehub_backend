import { Request, Response } from "express";
import { IPaymentService } from "../interfaces/services/IPaymentService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { asyncHandler } from "../utils/async-handler";

export class PaymentController {
  constructor(private _paymentService: IPaymentService) {}

  createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { bookingId } = req.body;
    
    const result = await this._paymentService.createCheckoutSession(userId, bookingId);
    
    res.status(HttpStatusCode.CREATED).json(
      createSuccessResponse(result, SUCCESS_MESSAGES.CHECKOUT_SESSION_CREATED)
    );
  });

  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const event = req.body;
    const result = await this._paymentService.handleWebhookEvent(event);
    
    res.status(HttpStatusCode.OK).json(createSuccessResponse(result));
  });

  verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, bookingId } = req.body;
    const result = await this._paymentService.verifyAndFinalizePayment(sessionId, bookingId);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(result, result?.message)
    );
  });

  payWithWallet = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { bookingId } = req.body;

    await this._paymentService.payWithWallet(userId, bookingId);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(null, SUCCESS_MESSAGES.PAYMENT_SUCCESS)
    );
  });
}