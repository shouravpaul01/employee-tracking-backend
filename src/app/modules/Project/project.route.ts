import { Router } from "express";
import { ProjectController } from "./project.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { ProjectValidation } from "./project.validation";

const router = Router();

router.post(
  "/",
  auth(UserRole.ADMIN),
  validateRequest(ProjectValidation.createProject),
  ProjectController.createProject,
);

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.EMPLOYEE),
  ProjectController.getAllProjects,
);

router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.EMPLOYEE),
  ProjectController.getSingleProject,
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN),
  validateRequest(ProjectValidation.updateProject),
  ProjectController.updateProject,
);

router.delete("/:id", auth(UserRole.ADMIN), ProjectController.deleteProject);

export const ProjectRoute = router;
