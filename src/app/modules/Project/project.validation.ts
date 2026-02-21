import { z } from "zod";

 const createProject= z.object({
  name: z.string().trim().nonempty( "Project name is required"),
  clientName: z.string().trim().nonempty("Client name is required"),
  propertyAddress: z.string().nonempty("Property address is required"),
  accessInfo: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["STAGING", "WALKTHROUGH", "DESTAGING", "COMPLETED"]).optional(),
  
});

 const updateProject= z.object({
  name: z.string().optional(),
  clientName: z.string().optional(),
  propertyAddress: z.string().optional(),
  accessInfo: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["STAGING", "WALKTHROUGH", "DESTAGING", "COMPLETED"]).optional(),
 
});

export const ProjectValidation={
    createProject,
    updateProject
}