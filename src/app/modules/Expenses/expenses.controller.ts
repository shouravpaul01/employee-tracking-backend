import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { ExpensesService } from "./expenses.service";
import { ExpensesStatus } from "@prisma/client";

const createExpense = catchAsync(async (req, res) => {
  const result = await ExpensesService.createExpenses(
    req.user.id,
    req.file as Express.Multer.File,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Expense added successfully.",
    data: result,
  });
});
export const getAllExpenses = catchAsync(async (req, res) => {
  const result = await ExpensesService.getAllExpenses(
    req.query as Record<string, undefined>,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Expenses fetched successfully.",
    ... result,
  });
});
export const getSingleExpense = catchAsync(async (req, res) => {
  
  const result = await ExpensesService.getSingleExpense(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Expense details fetched successfully.",
    data: result,
  });
});
const updateExpenseStatus = catchAsync(async (req, res) => {
  const result = await ExpensesService.updateStatus({
    expenseId: req.params.id,
    status: req.query.status as ExpensesStatus,
    feedback: req.body.feedback,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Expense status updated successfully.",
    data: result,
  });
});
export const getAllExpensesByEmployee = catchAsync(async (req, res) => {
  const result = await ExpensesService.getAllExpensesByEmployee(
    req.user.id,
    req.query as Record<string, undefined>,
  );
console.log(result,"dkdk")
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All Expenses fetched successfully.",
    ... result,
  });
});
export const ExpensesController = {
  createExpense,
  getAllExpenses,
  getSingleExpense,
  updateExpenseStatus,
  getAllExpensesByEmployee,
};
