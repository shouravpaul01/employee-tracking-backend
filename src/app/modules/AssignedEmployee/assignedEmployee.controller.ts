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
  const { status, projectId } = req.query;
  const result = await AssignedEmployeeService.updateCheckInOutBreakInOutTime(
    req.user.id,
    projectId as string,
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
  const { date } = req.query;

  const result = await AssignedEmployeeService.getProjectsByAssignedDate(
    date as string,
    req.user.id,
  );

  res.status(200).json({
    success: true,
    message: "Assigned Projects fetched successfully",
    data: result,
  });
});
export const AssignedEmployeeController = {
  assignedEmployee,
  updateCheckInOutBreakInOutTime,
  getProjectsByAssignedDate,
};
