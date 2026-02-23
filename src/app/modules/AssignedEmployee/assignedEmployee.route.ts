import { UserRole } from "@prisma/client";
import express from "express";
import { AssignedEmployeeController } from "./assignedEmployee.controller";
import auth from "../../middlewares/auth";
import { AssignedEmployeeValidation } from "./assignedEmployee.validation";
import validateRequest from "../../middlewares/validateRequest";
const router = express.Router();

router.post(
  "/",
  auth(UserRole.ADMIN),
  validateRequest(AssignedEmployeeValidation.assignedEmployee),
  AssignedEmployeeController.assignedEmployee,
);
router.patch(
  "/update-attendance-time/:id",
  auth(UserRole.EMPLOYEE),
  AssignedEmployeeController.updateCheckInOutBreakInOutTime,
);
router.get(
  "/assigned-projects",
  auth(UserRole.ADMIN, UserRole.EMPLOYEE),
  AssignedEmployeeController.getProjectsByAssignedDate,
);
export const AssignedEmployeeRoute = router;
