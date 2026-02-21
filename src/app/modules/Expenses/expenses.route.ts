import { Router } from "express";
import { ExpensesController } from "./expenses.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { ExpensesValidation } from "./expenses.validation";

const router = Router();

router.post("/", auth(UserRole.EMPLOYEE),validateRequest(ExpensesValidation.createExpense), ExpensesController.createExpense);

router.get("/", auth(UserRole.ADMIN), ExpensesController.getAllExpenses);


router.get(
  "/:id",
  auth(UserRole.EMPLOYEE, UserRole.ADMIN),
  ExpensesController.getSingleExpense,
);

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

export default router;
