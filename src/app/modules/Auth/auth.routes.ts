import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { AuthControllers } from "./auth.controller";
import { AuthValidations } from "./auth.validation";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/register",
  auth(UserRole.ADMIN),
  validateRequest(AuthValidations.createUser),

  AuthControllers.register,
);

// user login route
router.post(
  "/login",
  validateRequest(AuthValidations.login),
  AuthControllers.loginUser,
);
router.post("/refresh-token", AuthControllers.refreshToken);
router.patch(
  "/change-password",
  validateRequest(AuthValidations.changePassword),
  auth(),
  AuthControllers.changePassword,
);

router.post(
  "/forgot-password",
  validateRequest(AuthValidations.forgotPassword),
  AuthControllers.forgotPassword,
);

router.post(
  "/reset-password",
  validateRequest(AuthValidations.resetPassword),
  AuthControllers.resetPassword,
);
router.post("/logout", AuthControllers.logout);
export const AuthRoutes = router;
