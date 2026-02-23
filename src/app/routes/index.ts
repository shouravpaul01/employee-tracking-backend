import express from "express";

import { AuthRoutes } from "../modules/Auth/auth.routes";
import { UserRoutes } from "../modules/User/user.route";
import { AssignedEmployeeRoute } from "../modules/AssignedEmployee/assignedEmployee.route";
import { ProjectRoute } from "../modules/Project/project.route";
import { ExpensesRoute } from "../modules/Expenses/expenses.route";
import { NotificationRoute } from "../modules/Notification/notification.route";
import { AnalyticsRoute } from "../modules/Analytics/analytics.route";


const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/projects",
    route: ProjectRoute,
  },
 {
    path: "/assigned-employee",
    route: AssignedEmployeeRoute,
  },
 {
    path: "/expenses",
    route: ExpensesRoute,
  },
   {
    path: "/notifications",
    route: NotificationRoute,
  },
  {
    path: "/analytics",
    route: AnalyticsRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
