import { UserRole } from "@prisma/client";
import { z } from "zod";

const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(6),
  }),
});
const loginValidationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});
const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});
const resetPasswordSChema = z.object({
  body: z.object({
    token: z.string(),
    userId: z.string(),
    password: z.string(),
  }),
});

const CreateUser = z.object({
  body: z.object({
    name: z.string().trim().nonempty("Name is required."),
    email: z.string().nonempty("Email is required.").email({
      message: "Valid email is required.",
    }),
   
    password: z.string().nonempty("Password is required.")
  }),
});

export const AuthValidations = {
  changePasswordValidationSchema,
  loginValidationSchema,
  resetPasswordSChema,
  forgotPasswordSchema,
  CreateUser,
};
