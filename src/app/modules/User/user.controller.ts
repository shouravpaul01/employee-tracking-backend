import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import { UserService } from "./user.service";
import sendResponse from "../../../shared/sendResponse";


const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All users retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const result = await UserService.getUserById(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully!",
    data: result,
  });
});



const blockUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const result = await UserService.blockUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const result = await UserService.deleteUser(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully!",
    data: result,
  });
});


const updateMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await UserService.updateMe(userId, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Successfully profile updated.",
    data: result,
  });
});
// get user profile
const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await UserService.getMe(userId as string);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Your profile retrieved successfully",
    data: result,
  });
});

export const UserController = {
  getUserById,

  deleteUser,
  getAllUsers,
  blockUser,
  updateMe,
  getMe,
};
