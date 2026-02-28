import { AssignedEmployeeRole, ProjectStatus } from "@prisma/client";
import { z } from "zod";

const assignedEmployee = z.object({
  body: z.object({
    projectId: z.string().trim().nonempty("Project ID is required"),
    employeeId: z.string().trim().nonempty("Project ID is required"),
    role: z.enum([AssignedEmployeeRole.PICKER, AssignedEmployeeRole.RUNNER], {
      message: "Role must be 'RUNNER' or 'PIKER'",
    }),
  }),
});
const updateEmployeeRole = z.object({
  body: z.object({
    role: z.enum([AssignedEmployeeRole.PICKER, AssignedEmployeeRole.RUNNER], {
      message: "Role must be 'RUNNER' or 'PIKER'",
    }),
  }),
});

export const AssignedEmployeeValidation={
    assignedEmployee,
    updateEmployeeRole
}
