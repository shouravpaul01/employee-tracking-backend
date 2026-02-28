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
router.get(
  "/recent-entries-with-summery",
  auth(UserRole.EMPLOYEE),
  AssignedEmployeeController.getRecentEntriesEmployeeWeeklySummary,
);
router.patch(
  "/update-attendance-time/:id",
  auth(UserRole.EMPLOYEE),
  AssignedEmployeeController.updateCheckInOutBreakInOutTime,
);
router.patch(
  "/:id/role",
  auth(UserRole.EMPLOYEE, UserRole.ADMIN),
  // validateRequest(AssignedEmployeeValidation.updateEmployeeRole),
  AssignedEmployeeController.updateAssignedEmployeeRole,
);
router.get(
  "/employees-weekly-summary",
  auth(UserRole.ADMIN),
  AssignedEmployeeController.getWeeklyEmployeeSummary,
);
router.get(
  "/single-assigned-employee/:id",
  auth(),
  AssignedEmployeeController.getSingleAssignedProject,
);
export const AssignedEmployeeRoute = router;
