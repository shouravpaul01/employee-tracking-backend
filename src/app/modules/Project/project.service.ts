import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import QueryBuilder from "../../../helpers/queryBuilder";
import ApiPathError from "../../../errors/ApiPathError";

const createProject = async (payload: any) => {
  const existingName = await prisma.project.findUnique({
    where: { name: payload.name },
  });
  if (existingName) {
    throw new ApiPathError(httpStatus.CONFLICT,"name","Already exists the name.")
  }
  return prisma.project.create({
    data: {
      ...payload,
    },
  });
};

const getAllProjects = async (query: Record<string, undefined>) => {
  const queryBuilder = new QueryBuilder(prisma.project, query);
  const result = queryBuilder
    .search(["name", "clientName", "propertyAddress"])
    .filter()
    .sort()
    .include({ employee: true, project: true })
    .paginate()
    .execute();
  const meta = await queryBuilder.countTotal();
  return { data: result, meta };
};

const getSingleProject = async (id: string) => {
  // today range
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      expenses: true,

      assignedEmployees: {
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          employee: true,
        },
      },
    },
  });

  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, "Project not found");
  }

  return project;
};

const updateProject = async (id: string, payload: any) => {
  const existingProject = await prisma.project.findUnique({ where: { id } });

  if (!existingProject) {
    throw new ApiError(httpStatus.NOT_FOUND, "Project not found");
  }

  return prisma.project.update({
    where: { id },
    data: {
      ...payload,
    },
  });
};

const deleteProject = async (id: string) => {
  const exist = await prisma.project.findUnique({ where: { id } });

  if (!exist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Project not found");
  }

  await prisma.project.delete({ where: { id } });

  return null;
};

export const ProjectService = {
  createProject,
  getAllProjects,
  getSingleProject,
  updateProject,
  deleteProject,
};
