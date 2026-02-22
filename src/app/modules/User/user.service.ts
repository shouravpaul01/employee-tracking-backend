
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { User, UserRole, UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import QueryBuilder from "../../../helpers/queryBuilder";

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
   
  });
  return user;
};


const blockUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user not found");
  }

  // Determine the new status
  const newStatus =
    user.status === UserStatus.BLOCKED ? UserStatus.ACTIVE : UserStatus.BLOCKED;

  const result = await prisma.user.update({
    where: { id },
    data: { status: newStatus },
  });

  return {
    data: result,
    message:
      newStatus === UserStatus.BLOCKED
        ? "User blocked successfully"
        : "User unblocked successfully",
  };
};

const deleteUser = async (id: string) => {
  const result = await prisma.user.update({
    where: { id },
    data: { isDeleted: true },
  });

  return result;
};

const getAllUsers = async (queryParams: Record<string, any>) => {
  try {
    const queryBuilder = new QueryBuilder(prisma.user, queryParams);
    const users = await queryBuilder
      .search(["name", "email", "phone"])
      .rawFilter({
        role: {
          not: UserRole.ADMIN,
        },
        isDeleted: false,
      })
      .sort()
      .include({ hospital: true })
      .paginate()
      .execute();

    const meta = await queryBuilder.countTotal();
    return { data: users, meta };
  } catch (error) {
  
    return {
      meta: { page: 1, limit: 10, total: 0, totalPage: 0 },
      data: [],
    };
  }
};

// get user profile
const getMe = async (userId: string) => {
  //  Get User Info
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!existingUser) throw new ApiError(httpStatus.NOT_FOUND, "User not found.");

  //  Date Ranges
  const now = new Date();

  // Today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // This Month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

 
  // EMPLOYEE DASHBOARD

  if (existingUser.role === UserRole.EMPLOYEE) {
    // Today assigned projects
    const todayAssignedProjects = await prisma.assignedEmployee.count({
      where: {
        employeeId: userId,
        createdAt: { gte: todayStart, lte: todayEnd },
      },
    });

    // Monthly working hours
    const monthlyAttendances = await prisma.assignedEmployee.findMany({
      where: {
        employeeId: userId,
        createdAt: { gte: monthStart, lte: monthEnd },
        checkIn: { not: null },
        checkOut: { not: null },
      },
      select: { checkIn: true, checkOut: true, breakTimeStart: true, breakTimeEnd: true },
    });

    let totalHours = 0;
    monthlyAttendances.forEach((item) => {
      const checkIn = new Date(item.checkIn!);
      const checkOut = new Date(item.checkOut!);
      let workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

      if (item.breakTimeStart && item.breakTimeEnd) {
        workHours -= (new Date(item.breakTimeEnd).getTime() - new Date(item.breakTimeStart).getTime()) / (1000 * 60 * 60);
      }
      if (workHours < 0) workHours = 0;
      totalHours += workHours;
    });

    // Approved expenses
    const approvedExpenses = await prisma.expenses.aggregate({
      where: { employeeId: userId, status: "APPROVED" },
      _sum: { amount: true },
    });

    return {
      user:existingUser,
      dashboard: {
        todayAssignedProjects,
        monthlyWorkingHours: Number(totalHours.toFixed(2)),
        totalApprovedExpenses: approvedExpenses._sum.amount || 0,
      },
    };
  }

  // ADMIN summery

  if (existingUser.role === UserRole.ADMIN) {
    // Total projects
    const totalProjects = await prisma.project.count();

    // Total employee monthly working hours
    const allAttendances = await prisma.assignedEmployee.findMany({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        checkIn: { not: null },
        checkOut: { not: null },
      },
      select: { checkIn: true, checkOut: true, breakTimeStart: true, breakTimeEnd: true },
    });

    let totalEmployeeHours = 0;
    allAttendances.forEach((item) => {
      const checkIn = new Date(item.checkIn!);
      const checkOut = new Date(item.checkOut!);
      let workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

      if (item.breakTimeStart && item.breakTimeEnd) {
        workHours -= (new Date(item.breakTimeEnd).getTime() - new Date(item.breakTimeStart).getTime()) / (1000 * 60 * 60);
      }
      if (workHours < 0) workHours = 0;
      totalEmployeeHours += workHours;
    });

    // Total approved expenses
    const totalApprovedExpenses = await prisma.expenses.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    });

    return {
      user:existingUser,
      dashboard: {
        totalProjects,
        totalEmployeeMonthlyHours: Number(totalEmployeeHours.toFixed(2)),
        totalApprovedExpenses: totalApprovedExpenses._sum.amount || 0,
      },
    };
  }
};
const updateMe = async (id: string, payload: User) => {
  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "user not found");
  }
  const result = await prisma.user.update({ where: { id }, data: payload });
  return result;
};

export const UserService = {
  getUserById,
 
  deleteUser,
  getAllUsers,
  blockUser,
  updateMe,
  getMe,
};
