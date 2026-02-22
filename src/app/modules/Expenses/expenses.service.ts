import { Expenses, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiPathError from "../../../errors/ApiPathError";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import { IUpdateExpenseStatus } from "./expenses.interface";
import QueryBuilder from "../../../helpers/queryBuilder";
import config from "../../../config";
import { NotificationService } from "../Notification/notification.service";

const createExpenses = async (
  employeeId: string,
  payload: Omit<Expenses, "employeeId">,
) => {
  const newExpenses = {
    employeeId,
    ...payload,
  };

  const result = await prisma.expenses.create({
    data: newExpenses,
    include: { employee: true },
  });

  await NotificationService.createNotification({
    title: "New Expense Request",
    message: `${result?.employee?.name || "An employee"} submitted a new expense.`,
    type: "EXPENSE",
    senderId: employeeId,
    referenceId: result.id,
    referenceType: "EXPENSE",
    receiverRole: UserRole.ADMIN, 
  });
  return result;
};
const getAllExpenses = async (query: Record<string, undefined>) => {
  const queryBuilder = new QueryBuilder(prisma.expenses, query);
  const result = queryBuilder
    .filter()
    .sort()
    .include({ employee: true, project: true })
    .paginate()
    .execute();
  const meta = await queryBuilder.countTotal();
  return { data: result, meta };
};
const getSingleExpense = async (expenseId: string) => {
  const expense = await prisma.expenses.findUnique({
    where: { id: expenseId },
    include: {
      employee: true,
      project: true,
    },
  });

  if (!expense) {
    throw new ApiError(httpStatus.NOT_FOUND, "Expense not found.");
  }

  return expense;
};
const updateStatus = async (payload: IUpdateExpenseStatus) => {
  const { expenseId, status, feedback } = payload;

  const validStatuses = ["PENDING", "APPROVED", "REJECTED"] as const;

  if (!validStatuses.includes(status)) {
    throw new ApiPathError(
      httpStatus.BAD_REQUEST,
      "status",
      `Invalid status. Must be one of: ${validStatuses.join(", ")}.`
    );
  }

  const expense = await prisma.expenses.findUnique({
    where: { id: expenseId },
  });

  if (!expense) {
    throw new ApiError(httpStatus.NOT_FOUND, "Expense not found.");
  }

  if (status === "REJECTED" && (!feedback || feedback.trim() === "")) {
    throw new ApiPathError(
      httpStatus.BAD_REQUEST,
      "feedback",
      "Feedback is required when rejecting an expense."
    );
  }

  //  Update expense
  const updatedExpense = await prisma.expenses.update({
    where: { id: expenseId },
    data: {
      status,
      feedback: status === "REJECTED" ? feedback : undefined,
    },
  });

  //  Send notification to employee (owner of expense)
  let message = "";

  if (status === "APPROVED") {
    message = "Your expense request has been approved.";
  } else if (status === "REJECTED") {
    message = `Your expense request was rejected. Reason: ${feedback}`;
  } else {
    message = "Your expense status has been updated.";
  }

  await NotificationService.createNotification({
    title: "Expense Status Updated",
    message,
    type: "EXPENSE",
    senderId: undefined, 
    referenceId: expenseId,
    referenceType: "EXPENSE",
    receiverId: expense.employeeId, 
  });

  return updatedExpense;
};
const getAllExpensesByEmployee = async (
  employeeId: string,
  query: Record<string, any>,
) => {
  const findQuery = { employeeId, ...query };

  const queryBuilder = new QueryBuilder(prisma.expenses, findQuery);
  const result = await queryBuilder
    .filter()
    .sort()
    .include({ employee: true, project: true })
    .paginate()
    .execute();
  const meta = await queryBuilder.countTotal();

  // Aggregation: total amount per status
  const totals = await prisma.expenses.groupBy({
    by: ["status"],
    where: findQuery,
    _sum: {
      amount: true,
    },
  });

  const totalByStatus: Record<string, number> = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  };

  totals.forEach((item) => {
    totalByStatus[item.status] = item._sum.amount ?? 0;
  });

  return { data: result, meta, totalByStatus };
};
export const ExpensesService = {
  createExpenses,
  getAllExpenses,
  getSingleExpense,
  updateStatus,
  getAllExpensesByEmployee,
};
