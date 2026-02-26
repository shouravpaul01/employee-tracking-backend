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

  // 1️⃣ fetch filtered, searched, sorted, paginated projects
  const projects = await queryBuilder
    .search(["name", "clientName", "propertyAddress"])
    .filter()
    .sort()
    .paginate()
    .execute();

  const meta = await queryBuilder.countTotal();

  // 2️⃣ calculate today's assigned employee count per project
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const projectIds = projects.map((p: any) => p.id);

  // prisma aggregate query for count
  const assignedCounts = await prisma.assignedEmployee.groupBy({
    by: ["projectId"],
    where: {
      projectId: { in: projectIds },
      createdAt: { gte: startOfDay },
    },
    _count: { id: true },
  });

  // 3️⃣ attach count to each project
  const resultWithCount = projects.map((project: any) => {
    const countObj = assignedCounts.find(
      (c) => c.projectId === project.id
    );
    return {
      ...project,
      todayAssignedEmployees: countObj?._count?.id || 0,
    };
  });

  return { data: resultWithCount, meta };
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
