import { AssignedEmployee, AttendanceStatus, UserRole } from "@prisma/client";
import exp from "constants";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import ApiPathError from "../../../errors/ApiPathError";
import { NotificationService } from "../Notification/notification.service";
import QueryBuilder from "../../../helpers/queryBuilder";
import { startOfISOWeek, endOfISOWeek } from 'date-fns';

const assignedEmployee = async (payload: AssignedEmployee) => {
  const existingProject = await prisma.project.findUnique({
    where: { id: payload.projectId },
  });
  if (!existingProject) {
    throw new ApiError(httpStatus.NOT_FOUND, "Project not found.");
  }
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const existingAssignedEmployee = await prisma.assignedEmployee.findFirst({
    where: {
      employeeId: payload.employeeId,
      projectId: payload.projectId,
      createdAt: {
        gte: startOfDay,
      },
    },
  });
  if (existingAssignedEmployee) {
    throw new ApiPathError(
      httpStatus.CONFLICT,
      "employeeId",
      "This employee has already been assigned to this project today.",
    );
  }
  const result = await prisma.assignedEmployee.create({ data: { ...payload } });
  await prisma.project.update({
    where: { id: existingProject.id },
    data: { lastWorkingDate: new Date() },
  });
  await NotificationService.createNotification({
    title: "New Project Assigned",
    message: `You have been assigned to project: ${existingProject.name}`,
    type: "PROJECT",
    referenceId: existingProject.id,
    referenceType: "ASSIGNMENT",
    receiverId: payload.employeeId,
  });
  return result;
};
const updateCheckInOutBreakInOutTime = async (
  userId: string,
  assignedId: string,
  status: AttendanceStatus,
) => {
  const validStatuses = [
    "CHECKED_IN",
    "ON_BREAK",
    "BREAK_ENDED",
    "CHECKED_OUT",
  ] as AttendanceStatus[];

  if (!validStatuses.includes(status)) {
    throw new ApiPathError(
      httpStatus.BAD_REQUEST,
      "status",
      `Invalid status. Must be one of: ${validStatuses.join(", ")}.`,
    );
  }
  const now = new Date();
  let message = "";

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  //  find today's assignment
  const assignedEmployee = await prisma.assignedEmployee.findFirst({
    where: {
      id: assignedId,
      employeeId: userId,
    },
    include: {
      employee: true,
      project: true,
    },
  });

  if (!assignedEmployee) {
    throw new ApiError(httpStatus.NOT_FOUND, "No project assigned for today");
  }

  let data: Partial<AssignedEmployee> = {};

  switch (status) {
    case "CHECKED_IN":
      if (assignedEmployee.status !== "NOT_STARTED") {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "You have already checked in",
        );
      }
      data = { checkIn: now, status: "CHECKED_IN" };
      message = "Checked in successfully";
      break;

    case "ON_BREAK":
      if (assignedEmployee.status !== "CHECKED_IN") {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Please check in before starting a break",
        );
      }
      data = { breakTimeStart: now, status: "ON_BREAK" };
      message = "Break started";
      break;

    case "BREAK_ENDED":
      if (assignedEmployee.status !== "ON_BREAK") {
        throw new ApiError(httpStatus.BAD_REQUEST, "No active break to end");
      }
      data = { breakTimeEnd: now, status: "CHECKED_IN" };
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
      data = { checkOut: now, status: "CHECKED_OUT" };
      message = "Checked out successfully";
      break;

    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status");
  }

  //  update assignment
  const updated = await prisma.assignedEmployee.update({
    where: { id: assignedEmployee.id },
    data,
  });

  // send notification to admins
  await NotificationService.createNotification({
    title: `Attendance Update: ${status}`,
    message: `Employee ${assignedEmployee.employee.name} has ${message.toLowerCase()} on project ${assignedEmployee.project.name}.`,
    type: "ATTENDANCE",
    senderId: userId,
    referenceId: assignedEmployee.id,
    referenceType: "ASSIGNMENT",
    receiverRole: UserRole.ADMIN,
  });

  return { data: updated, message };
};

const getProjectsByAssignedDate = async (
  userId: string,
  query: Record<string, undefined>,
) => {
  const dateStr = query.date;
  if (!dateStr) {
    throw new ApiError(400, "Date query parameter is required");
  }

  const parsedDate = new Date(dateStr);
  if (isNaN(parsedDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }
  const startOfDay = new Date(dateStr);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(dateStr);
  endOfDay.setHours(23, 59, 59, 999);

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  const queryBuilder = new QueryBuilder(prisma.project, query);
  const result = await queryBuilder
    .rawFilter({
      assignedEmployees: {
        some: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          ...(existingUser.role === UserRole.EMPLOYEE && {
            employeeId: userId,
          }),
        },
      },
    })
    .sort()
    .include({
      assignedEmployees: {
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
          ...(existingUser.role === UserRole.EMPLOYEE && {
            employeeId: userId,
          }),
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      expenses: true,
    })
    .paginate()
    .execute();

  const meta = await queryBuilder.countTotal();

  // ✨ Add todayAssignedEmployees field
  const dataWithCount = result.map((project:any)=> ({
    ...project,
    todayAssignedEmployees: project.assignedEmployees.length,
  }));

  return { data: dataWithCount, meta };
};


export const getRecentEntriesEmployeeWeeklySummary= async (
  employeeId: string,
  
) => {
  const weekStart = startOfISOWeek(new Date());
  const weekEnd = endOfISOWeek(new Date());

  // Fetch all entries for the week
  const queryBuilder = new QueryBuilder(prisma.assignedEmployee, {
    employeeId,
    createdAt: { gte: weekStart, lte: weekEnd },
  });

  const entries = await queryBuilder
    .filter()
    .include({ project: true })
    .execute();
 const meta = await queryBuilder.countTotal();

  // Group entries by day
  const dailyMinutesMap: Record<string, number> = {};

  entries.forEach((entry: any) => {
    if (entry.checkIn && entry.checkOut) {
      const checkIn = new Date(entry.checkIn).getTime();
      const checkOut = new Date(entry.checkOut).getTime();
      let durationMinutes = (checkOut - checkIn) / (1000 * 60);

      // Subtract break time if available
      if (entry.breakTimeStart && entry.breakTimeEnd) {
        const breakStart = new Date(entry.breakTimeStart).getTime();
        const breakEnd = new Date(entry.breakTimeEnd).getTime();
        durationMinutes -= (breakEnd - breakStart) / (1000 * 60);
      }

      if (durationMinutes <= 0) return;

      // Group by day (YYYY-MM-DD)
      const day = new Date(entry.checkIn).toISOString().split('T')[0];
      if (!dailyMinutesMap[day]) dailyMinutesMap[day] = 0;
      dailyMinutesMap[day] += durationMinutes;
    }
  });

  // Calculate weekly totals
  let totalRegularMinutes = 0;
  let totalOvertimeMinutes = 0;

  Object.values(dailyMinutesMap).forEach((minutes) => {
    const dailyRegular = Math.min(minutes, 8 * 60); // 8h regular
    const dailyOvertime = Math.max(minutes - 8 * 60, 0);
    totalRegularMinutes += dailyRegular;
    totalOvertimeMinutes += dailyOvertime;
  });

  const totalHours = (totalRegularMinutes + totalOvertimeMinutes) / 60;

  return {
    meta:{...meta,totalHours: parseFloat(totalHours.toFixed(2)),
    totalRegularHours: parseFloat((totalRegularMinutes / 60).toFixed(2)),
    totalOvertimeHours: parseFloat((totalOvertimeMinutes / 60).toFixed(2)),
    dailyBreakdown: Object.fromEntries(
      Object.entries(dailyMinutesMap).map(([day, minutes]) => {
        const regular = Math.min(minutes, 8 * 60);
        const overtime = Math.max(minutes - 8 * 60, 0);
        return [day, { regularHours: +(regular / 60).toFixed(2), overtimeHours: +(overtime / 60).toFixed(2) }];
      }),
    ),},
    data:entries, 
  };
};
export const AssignedEmployeeService = {
  assignedEmployee,
  updateCheckInOutBreakInOutTime,
  getProjectsByAssignedDate,
  getRecentEntriesEmployeeWeeklySummary
};
