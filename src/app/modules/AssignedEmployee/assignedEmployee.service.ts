import {
  AssignedEmployee,
  AssignedEmployeeRole,
  AttendanceStatus,
  UserRole,
} from "@prisma/client";
import exp from "constants";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import ApiPathError from "../../../errors/ApiPathError";
import { NotificationService } from "../Notification/notification.service";
import QueryBuilder from "../../../helpers/queryBuilder";
import { startOfISOWeek, endOfISOWeek, startOfWeek, endOfWeek } from "date-fns";

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
      data = { breakTimeEnd: now, status: "BREAK_ENDED" };
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
    .search(["name", "clientName"])
    .filter()
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
  const dataWithCount = result.map((project: any) => ({
    ...project,
    todayAssignedEmployees: project.assignedEmployees.length,
  }));

  return { data: dataWithCount, meta };
};
const getSingleAssignedProject = async (id: string) => {
  const project = await prisma.assignedEmployee.findUnique({
    where: { id },
    include: {
      project: true,
    },
  });

  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, "Project not found");
  }

  return project;
};

export const getRecentEntriesEmployeeWeeklySummary = async (
  employeeId: string,
) => {
  const findQuery = { employeeId };

  // 🔹 MAIN QUERY (unchanged)
  const queryBuilder = new QueryBuilder(prisma.assignedEmployee, findQuery);

  const entries = await queryBuilder
    .filter()
    .include({ project: true })
    .execute();

  const meta = await queryBuilder.countTotal();

  // 🔹 ENTRY LEVEL CALCULATION
  const result = entries.map((item: any) => {
    if (!item.checkIn || !item.checkOut) {
      return {
        ...item,
        totalHours: 0,
        normalHours: 0,
        overtimeHours: 0,
        doubleOvertimeHours: 0,
      };
    }

    let totalMs = item.checkOut.getTime() - item.checkIn.getTime();

    if (item.breakTimeStart && item.breakTimeEnd) {
      totalMs -= item.breakTimeEnd.getTime() - item.breakTimeStart.getTime();
    }

    const totalHours = totalMs / (1000 * 60 * 60);

    let normalHours = 0;
    let overtimeHours = 0;
    let doubleOvertimeHours = 0;

    if (totalHours <= 8) {
      normalHours = totalHours;
    } else if (totalHours <= 12) {
      normalHours = 8;
      overtimeHours = totalHours - 8;
    } else {
      normalHours = 8;
      overtimeHours = 4;
      doubleOvertimeHours = totalHours - 12;
    }

    return {
      ...item,
      totalHours: Number(totalHours.toFixed(2)),
      normalHours: Number(normalHours.toFixed(2)),
      overtimeHours: Number(overtimeHours.toFixed(2)),
      doubleOvertimeHours: Number(doubleOvertimeHours.toFixed(2)),
    };
  });

  // ================================
  // 🔥 SEPARATE WEEKLY QUERY
  // ================================

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const weeklyEntries = await prisma.assignedEmployee.findMany({
    where: {
      employeeId,
      createdAt: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    },
  });

  let weeklyTotalHours = 0;
  let weeklyRegularHours = 0;
  let weeklyOvertimeHours = 0;
  let weeklyDoubleOvertimeHours = 0;

  weeklyEntries.forEach((item: any) => {
    if (!item.checkIn || !item.checkOut) return;

    let totalMs = item.checkOut.getTime() - item.checkIn.getTime();

    if (item.breakTimeStart && item.breakTimeEnd) {
      totalMs -= item.breakTimeEnd.getTime() - item.breakTimeStart.getTime();
    }

    const totalHours = totalMs / (1000 * 60 * 60);

    if (totalHours <= 8) {
      weeklyRegularHours += totalHours;
    } else if (totalHours <= 12) {
      weeklyRegularHours += 8;
      weeklyOvertimeHours += totalHours - 8;
    } else {
      weeklyRegularHours += 8;
      weeklyOvertimeHours += 4;
      weeklyDoubleOvertimeHours += totalHours - 12;
    }

    weeklyTotalHours += totalHours;
  });

  return {
    data: result,
    meta: {
      ...meta,
      weeklySummary: {
        totalHours: Number(weeklyTotalHours.toFixed(2)),
        regularHours: Number(weeklyRegularHours.toFixed(2)),
        overtimeHours: Number(weeklyOvertimeHours.toFixed(2)),
        doubleOvertimeHours: Number(weeklyDoubleOvertimeHours.toFixed(2)),
      },
    },
  };
};
export const updateAssignedEmployeeRole = async (
  assignedEmployeeId: string,
  newRole: AssignedEmployeeRole,
) => {
  // Check if assigned employee exists
  const assignedEmployee = await prisma.assignedEmployee.findUnique({
    where: { id: assignedEmployeeId },
  });

  if (!assignedEmployee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Assigned employee not found");
  }

  // Update role
  const updatedEmployee = await prisma.assignedEmployee.update({
    where: { id: assignedEmployeeId },
    data: { role: newRole },
  });

  return updatedEmployee;
};

export const getWeeklyEmployeeSummary = async (
  query: Record<string, undefined>,
) => {
  const today = new Date();

  // calculate current week Monday-Sunday
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const queryBuilder = new QueryBuilder(prisma.assignedEmployee, query);

  const entries = await queryBuilder
    .rawFilter({
      checkIn: { gte: weekStart, lte: weekEnd },
      checkOut: { not: null },
    })
    .include({ employee: true })
    .execute();

  const meta = await queryBuilder.countTotal();

  // group by employee
  const grouped: Record<string, AssignedEmployee[]> = {};
  for (const entry of entries) {
    if (!grouped[entry.employeeId]) grouped[entry.employeeId] = [];
    grouped[entry.employeeId].push(entry);
  }

  // compute weekly totals
  const result: any = [];

  for (const employeeId in grouped) {
    const employeeEntries: any = grouped[employeeId];
    let totalHours = 0;
    let normalHours = 0;
    let overtimeHours = 0;
    let doubleOvertimeHours = 0;

    for (const entry of employeeEntries) {
      if (!entry.checkIn || !entry.checkOut) continue;

      let ms = entry.checkOut.getTime() - entry.checkIn.getTime();

      if (entry.breakTimeStart && entry.breakTimeEnd) {
        ms -= entry.breakTimeEnd.getTime() - entry.breakTimeStart.getTime();
      }

      const hours = ms / (1000 * 60 * 60);
      totalHours += hours;

      if (hours <= 8) {
        normalHours += hours;
      } else if (hours <= 12) {
        normalHours += 8;
        overtimeHours += hours - 8;
      } else {
        normalHours += 8;
        overtimeHours += 4;
        doubleOvertimeHours += hours - 12;
      }
    }

    const employeeInfo = employeeEntries[0]?.employee;

    result.push({
      employee: {
        id: employeeInfo.id,
        name: employeeInfo.name,
        email: employeeInfo.email,
        phone: employeeInfo.phone,
        photo: employeeInfo.photo,
      },
      totalHours: Number(totalHours.toFixed(2)),
      normalHours: Number(normalHours.toFixed(2)),
      overtimeHours: Number(overtimeHours.toFixed(2)),
      doubleOvertimeHours: Number(doubleOvertimeHours.toFixed(2)),
    });
  }

  return { data: result, meta };
};
export const AssignedEmployeeService = {
  assignedEmployee,
  updateCheckInOutBreakInOutTime,
  getProjectsByAssignedDate,
  getSingleAssignedProject,
  getRecentEntriesEmployeeWeeklySummary,
  updateAssignedEmployeeRole,
  getWeeklyEmployeeSummary,
};
