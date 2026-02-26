import { UserRole } from "@prisma/client";
import { z } from "zod";


const createUser = z.object({
  body: z.object({
    name: z.string().trim().nonempty("Name is required."),
    email: z.string().nonempty("Email is required.").email({
      message: "Valid email is required.",
    }),
   
    password: z.string().nonempty("Password is required.")
  }),
});
const login = z.object({
  body: z.object({
    email: z.string().nonempty("Email is required.").email("Valid email is required."),
    password: z.string().nonempty("Password is required."),
    role:z.enum([UserRole.ADMIN,UserRole.EMPLOYEE],{message:"Invalid role."})
  }),
});
const forgotPassword = z.object({
  body: z.object({
     email: z.string().nonempty("Email is required.").email("Valid email is required."),
  }),
});
const resetPassword = z.object({
  body: z.object({
    token: z.string().nonempty("Token is required."),
    password: z.string().nonempty("Password is required."),
  }),
});
const changePassword= z.object({
  body: z.object({
    currentPassword: z.string().nonempty("Current password is required."),
    newPassword: z.string().nonempty("New password is required."),
  }),
});
export const AuthValidations = {
  login,
  forgotPassword,
  resetPassword,
  createUser,
  changePassword
};
