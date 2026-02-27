import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AssignedEmployeeService } from "./assignedEmployee.service";
import { AttendanceStatus } from "@prisma/client";
import { query } from "express";

const assignedEmployee = catchAsync(async (req, res) => {
  const result = await AssignedEmployeeService.assignedEmployee(req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Successfully assigned an employee.",
    data: result,
  });
});
const updateCheckInOutBreakInOutTime = catchAsync(async (req, res) => {
  const { status } = req.query;
  const { id } = req.params;
  const result = await AssignedEmployeeService.updateCheckInOutBreakInOutTime(
    req.user.id,
    id as string,
    status as AttendanceStatus,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || "Successfully assigned an employee.",
    data: result.data,
  });
});
const getProjectsByAssignedDate = catchAsync(async (req, res) => {
  const result = await AssignedEmployeeService.getProjectsByAssignedDate(
    req.user.id,
    req.query as Record<string, undefined>,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Assigned Projects fetched successfully",
    ...result,
  });
});
const getRecentEntriesEmployeeWeeklySummary = catchAsync(async (req, res) => {
  const result =
    await AssignedEmployeeService.getRecentEntriesEmployeeWeeklySummary(
      req.user.id,
    );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recent entries fetched successfully",
    ...result,
  });
});
export const AssignedEmployeeController = {
  assignedEmployee,
  updateCheckInOutBreakInOutTime,
  getProjectsByAssignedDate,
  getRecentEntriesEmployeeWeeklySummary
};
