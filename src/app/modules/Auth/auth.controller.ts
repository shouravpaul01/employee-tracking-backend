import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthServices } from "./auth.service";
import ApiError from "../../../errors/ApiErrors";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.register(req.body);
});
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body);

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: true, // dev
    sameSite: "lax",
  });

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.accessToken ? { accessToken: result.accessToken } : {},
  });
});
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token missing");
  }

  const result = await AuthServices.refreshToken(refreshToken);

  // Set new access token cookie
  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: false, // prod: true
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token refreshed successfully",
    data: null,
  });
});
// forgot password
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const data = await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email!",
    data: data,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.resetPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password Reset!",
    data: null,
  });
});
// change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  const result = await AuthServices.changePassword(
    userId,
    newPassword,
    currentPassword,
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password changed successfully",
    data: result,
  });
});
 const logout = catchAsync(async (req: Request, res: Response) => {
  // Clear both accessToken and refreshToken cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true, // prod: true
    sameSite: "lax",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true, // prod: true
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged out successfully",
    data: null,
  });
});
export const AuthControllers = {
  register,
  loginUser,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  logout
};
