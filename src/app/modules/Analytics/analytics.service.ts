import prisma from "../../../shared/prisma";

const getAdminDashboardAnalytics = async () => {
 
  // TOTAL PROJECT

  const totalProjects = await prisma.project.count();


  // EXPENSES SUMMARY

  const expensesSummary = await prisma.expenses.groupBy({
    by: ["status"],
    _sum: {
      amount: true,
    },
  });

  let pendingExpenses = 0;
  let approvedExpenses = 0;

  expensesSummary.forEach((item) => {
    if (item.status === "PENDING") {
      pendingExpenses = item._sum.amount || 0;
    }
    if (item.status === "APPROVED") {
      approvedExpenses = item._sum.amount || 0;
    }
  });

  // RECENT 10 PROJECTS
 
  const recentProjects = await prisma.project.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });


  //  RECENT PENDING EXPENSES
 
  const recentPendingExpenses = await prisma.expenses.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      employee: true,
      project: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });


  //  TEAM ACTIVITY (AssignedEmployee)
 
  const teamActivity = await prisma.assignedEmployee.findMany({
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return {
    summary: {
      totalProjects,
      pendingExpenses,
      approvedExpenses,
    },
    recentProjects,
    recentPendingExpenses,
    teamActivity,
  };
};

export const AnalyticsService={
    getAdminDashboardAnalytics
}