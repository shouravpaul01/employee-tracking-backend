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

const SignupValidation = z.object({
  body: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email({
      message: "Valid email is required.",
    }),
    phone: z.string().min(5),
    hospitalId: z.string(),
    role: z.enum(Object.values(UserRole) as [string, ...string[]]),
    password: z.string().min(6, {
      message: "Password must be at least 6 characters long.",
    }),
  }),
});

export const AuthValidations = {
  changePasswordValidationSchema,
  loginValidationSchema,
  resetPasswordSChema,
  forgotPasswordSchema,
  SignupValidation,
};
