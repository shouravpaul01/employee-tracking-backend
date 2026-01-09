import { User, UserStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import emailSender from "../../../helpers/emailSender";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import prisma from "../../../shared/prisma";
import { AuthUtils } from "./auth.utils";

const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
      isDeleted: false,
    },
  });

  if (!userData) {
    throw new Error("User not found");
  }

  if (userData.status === UserStatus.BLOCKED) {
    throw new Error("Your account is blocked.");
  }

  if (!payload.password || !userData?.password) {
    throw new Error("Password is required");
  }
  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new Error("Password incorrect!");
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      photo: userData.photo || null,
    },
    config.jwt.jwt_secret as Secret,
    (config.jwt.expires_in as string) || "7d"
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      role: userData.role,
      photo: userData.photo || null,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
    message: "User logged in successfully",
  };
};

const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (!userData) {
    throw new ApiError(404, "User not found");
  }

  const resetPassToken = jwtHelpers.generateToken(
    { email: userData.email, role: userData.role },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string
  );

  const resetPassLink =
    config.reset_pass_link + `?userId=${userData.id}&token=${resetPassToken}`;
  const template = await AuthUtils.createForgotPasswordTemplate(resetPassLink);
  await emailSender("Reset Your Password", userData.email, template);
  return {
    message: "Reset password link sent via your email successfully",
  };
};

// reset password
const resetPassword = async (payload: {
  token: string;
  userId: string;
  password: string;
}) => {
  const userData = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!userData) {
    throw new ApiError(404, "User not found");
  }

  const isValidToken = jwtHelpers.verifyToken(
    payload.token,
    config.jwt.reset_pass_secret as Secret
  );

  if (!isValidToken) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
  }

  // hash password
  const password = await bcrypt.hash(payload.password, 12);

  // update into database
  await prisma.user.update({
    where: {
      id: payload.userId,
    },
    data: {
      password,
      otp: null,
      otpExpireAt: null,
    },
  });
  return { message: "Password reset successfully" };
};

// change password
const changePassword = async (
  userId: string,
  newPassword: string,
  oldPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user?.password) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user?.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
  return { message: "Password changed successfully" };
};

const signup = async (payload: User) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findFirst({
        where: { email: payload.email },
      });
      if (existingUser) {
        throw new ApiError(httpStatus.CONFLICT, " email already exists");
      }

      const phoneExist = await tx.user.findFirst({
        where: { phone: payload.phone },
      });
      if (phoneExist) {
        throw new ApiError(httpStatus.CONFLICT, "phone already exists");
      }

      if (!payload.password) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "a temporary password is required"
        );
      }
      if (existingUser) {
        throw new ApiError(400, "This  phone or email already exists");
      }

      const hashedPassword: string = await bcrypt.hash(payload.password, 12);
      const userData = {
        ...payload,
        password: hashedPassword,
      };

      //create user
      const user = await tx.user.create({
        data: userData,
      });

      return { message: "signing up successfully" };
    });
    return result;
  } catch (error: any) {
    console.log("error", error);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error?.message || "something went wrong"
    );
  }
};

export const AuthServices = {
  signup,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
