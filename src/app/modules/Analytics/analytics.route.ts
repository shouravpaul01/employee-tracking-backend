import express from 'express'
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
import { AnalyticsController } from './analytics.controller';
const router=express.Router()

router.get(
  "/admin-dashboard-analytics",
  auth(UserRole.ADMIN), 
  AnalyticsController.getAdminDashboardAnalytics
);

export const AnalyticsRoute=router