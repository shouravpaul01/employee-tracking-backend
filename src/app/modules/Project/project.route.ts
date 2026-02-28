import { Router } from "express";
import { ProjectController } from "./project.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { ProjectValidation } from "./project.validation";
import { fileUploader } from "../../middlewares/fileUploader";
import { AssignedEmployeeValidation } from "../AssignedEmployee/assignedEmployee.validation";

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
router.patch(
  "/:id/media",
  auth(UserRole.ADMIN, UserRole.EMPLOYEE),

  fileUploader.fields(
    [
      { name: "file", maxCount: 1 },
      { name: "files", maxCount: 10 },
    ],
    {
      required: false,
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/mov",
        "video/quicktime",
      ],
      maxSize: 50 * 1024 * 1024, // 50MB (video support)
    },
  ),
validateRequest(ProjectValidation.updateMedia),
  ProjectController.updateProjectVideoPhotos,
);
export const ProjectRoute = router;
