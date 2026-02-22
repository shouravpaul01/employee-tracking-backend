import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { NotificationService } from "./notification.service";


const getAllNotificationByUser = catchAsync(async (req, res) => {
  const result = await NotificationService.getAllNotificationByUser(req.user.id,req.query as Record<string,undefined>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Notification fetched successfully.",
    data: result,
  });
});


export const NotificationController={
    getAllNotificationByUser
}