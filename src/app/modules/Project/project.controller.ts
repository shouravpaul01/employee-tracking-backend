import catchAsync from "../../../shared/catchAsync";
import httpStatus from "http-status";
import { ProjectService } from "./project.service";
import sendResponse from "../../../shared/sendResponse";

const createProject = catchAsync(async (req, res) => {
  const result = await ProjectService.createProject(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Project created successfully.",
    data: result,
  });
});

const getAllProjects = catchAsync(async (req, res) => {
  const result = await ProjectService.getAllProjects(req.query as Record<string,undefined>);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Projects fetched successfully.",
    ... result,
  });
});

const getSingleProject = catchAsync(async (req, res) => {
  const result = await ProjectService.getSingleProject(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project details fetched successfully.",
    data: result,
  });
});

const updateProject = catchAsync(async (req, res) => {
  const result = await ProjectService.updateProject(req.params.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project updated successfully.",
    data: result,
  });
});

const deleteProject = catchAsync(async (req, res) => {
  await ProjectService.deleteProject(req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Project deleted successfully.",
    data: null,
  });
});

export const ProjectController = {
  createProject,
  getAllProjects,
  getSingleProject,
  updateProject,
  deleteProject,
};