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
import ApiPathError from "../../../errors/ApiPathError";

const register = async (payload: User & { password: string }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, "Email already exists");
  }

  const hashedPassword: string = await bcrypt.hash(payload.password, 12);
  const { password, ...userData } = payload;
  //create user
  await prisma.user.create({
    data: {
      ...userData,
      credential: {
        create: {
          password: hashedPassword,
        },
      },
    },
  });

  return existingUser;
};
const loginUser = async (payload: { email: string; password: string }) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
      isDeleted: false,
    },
    include: { credential: true },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  if (existingUser.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is blocked.");
  }

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    existingUser.credential?.password as string,
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password incorrect!");
  }
  const accessToken = jwtHelpers.generateToken(
    {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
      photo: existingUser.photo || null,
    },
    config.jwt.jwt_secret as Secret,
    (config.jwt.expires_in as string) || "7d",
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      id: existingUser.id,
      name: existingUser.name,

      email: existingUser.email,
      role: existingUser.role,
      photo: existingUser.photo || null,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
    message: "User logged in successfully",
  };
};

const forgotPassword = async (payload: { email: string }) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const resetPassToken = jwtHelpers.generateToken(
    { id: existingUser.id, email: existingUser.email, role: existingUser.role },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string,
  );

  const resetPassLink = config.reset_pass_link + `token=${resetPassToken}`;
  const template = await AuthUtils.createForgotPasswordTemplate(resetPassLink);
  await emailSender("Reset Your Password", existingUser.email, template);
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
  const existingUser = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const isValidToken = jwtHelpers.verifyToken(
    payload.token,
    config.jwt.reset_pass_secret as Secret,
  );

  if (!isValidToken) {
    throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
  }

  // hash password
  const hashPassword = await bcrypt.hash(payload.password, 12);

  // update into database
  await prisma.credential.update({
    where: { userId: isValidToken.id },
    data: { password: hashPassword, otp: null, otpExpireAt: null },
  });
  return { message: "Password reset successfully" };
};

// change password
const changePassword = async (
  userId: string,
  newPassword: string,
  currentPassword: string,
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { credential: true },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    existingUser?.credential?.password as string
  );

  if (!isPasswordValid) {
    throw new ApiPathError(httpStatus.BAD_REQUEST,"currentPassword" ,"Incorrect old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.credential.update({
    where: {
      userId: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
  return { message: "Password changed successfully" };
};

export const AuthServices = {
  register,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
