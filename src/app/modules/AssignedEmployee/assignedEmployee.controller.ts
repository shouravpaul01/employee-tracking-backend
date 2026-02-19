import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AssignedEmployeeService } from "./assignedEmployee.service";
import { AttendanceStatus } from "@prisma/client";

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
    const {status,projectId}=req.query
  const result = await AssignedEmployeeService.updateCheckInOutBreakInOutTime(req.user.id,projectId as string,status as AttendanceStatus);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message || "Successfully assigned an employee.",
    data: result.data,
  });
});
export const AssignedEmployeeController = { assignedEmployee ,updateCheckInOutBreakInOutTime};
