import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { QuoteService } from "./quote.service";

const sendQuoteClient = catchAsync(async (req, res) => {

  const result = await QuoteService.sendQuoteClient(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

export const QuoteController = {
  sendQuoteClient,
};