import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AnalyticsService } from "./analytics.service";

const getAdminDashboardAnalytics = catchAsync(async (req, res) => {
  const result = await AnalyticsService.getAdminDashboardAnalytics();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin dashboard fetched successfully.",
    data: result,
  });
});


export const AnalyticsController={
    getAdminDashboardAnalytics
}