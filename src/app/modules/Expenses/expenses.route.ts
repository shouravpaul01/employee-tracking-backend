import { Router } from "express";
import { ExpensesController } from "./expenses.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { ExpensesValidation } from "./expenses.validation";
import { fileUploader } from "../../middlewares/fileUploader";
import { parseBodyData } from "../../middlewares/parseBodyData";

const router = Router();

router.post(
  "/",
  auth(UserRole.EMPLOYEE),
  fileUploader.single("receiptDocImage", { required: true }),
  parseBodyData,
  validateRequest(ExpensesValidation.createExpense),
  ExpensesController.createExpense,
);

router.get("/", auth(UserRole.ADMIN), ExpensesController.getAllExpenses);

router.patch(
  "/:id/status",
  auth(UserRole.ADMIN),
  ExpensesController.updateExpenseStatus,
);

router.get(
  "/my-expenses",
  auth(UserRole.EMPLOYEE),
  ExpensesController.getAllExpensesByEmployee,
);
router.get(
  "/:id",
  auth(UserRole.EMPLOYEE, UserRole.ADMIN),
  ExpensesController.getSingleExpense,
);
export const ExpensesRoute = router;
