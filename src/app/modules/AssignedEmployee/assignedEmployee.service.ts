import { AssignedEmployee, AttendanceStatus } from "@prisma/client";
import exp from "constants";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

const assignedEmployee = async (payload: AssignedEmployee) => {
  const existingProject = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });
  if (!existingProject) {
    throw new ApiError(httpStatus.NOT_FOUND, "Project not found.");
  }
  const result = await prisma.assignedEmployee.create({ data: { ...payload } });
  await prisma.project.update({
    where: { id: existingProject.id },
    data: { lastWorkingDate: new Date() },
  });
  return result;
};
const updateCheckInOutBreakInOutTime = async (
  userId: string,
  projectId: string,
  status: AttendanceStatus,
) => {
  const now = new Date();
  let message = "";

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const assignedEmployee = await prisma.assignedEmployee.findFirst({
    where: {
      employeeId: userId,
      projectId: projectId,
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  if (!assignedEmployee) {
    throw new ApiError(httpStatus.NOT_FOUND, "No project assigned for today");
  }

  let data: any = {};

  switch (status) {
    case "CHECKED_IN":
      if (assignedEmployee.status !== "NOT_STARTED") {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "You have already checked in",
        );
      }
      data = {
        checkIn: now,
        status: "CHECKED_IN",
      };
      message = "Checked in successfully";
      break;

    case "ON_BREAK":
      if (assignedEmployee.status !== "CHECKED_IN") {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Please check in before starting a break",
        );
      }
      data = {
        breakTimeStart: now,
        status: "ON_BREAK",
      };
      message = "Break started";
      break;

    case "BREAK_ENDED":
      if (assignedEmployee.status !== "ON_BREAK") {
        throw new ApiError(httpStatus.BAD_REQUEST, "No active break to end");
      }
      data = {
        breakTimeEnd: now,
        status: "CHECKED_IN",
      };
      message = "Break ended";
      break;

    case "CHECKED_OUT":
      if (
        assignedEmployee.status !== "CHECKED_IN" &&
        assignedEmployee.status !== "BREAK_ENDED"
      ) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "You must check in before checking out",
        );
      }
      data = {
        checkOut: now,
        status: "CHECKED_OUT",
      };
      message = "Checked out successfully";
      break;

    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status");
  }

  const updated = await prisma.assignedEmployee.update({
    where: {
      id: assignedEmployee.id,
      projectId: projectId,
      createdAt: {
        gte: startOfDay,
      },
    },
    data,
  });

  return { data: updated, message };
};

export const AssignedEmployeeService = {
  assignedEmployee,
  updateCheckInOutBreakInOutTime,
};
