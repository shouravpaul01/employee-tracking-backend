import express from 'express'
import auth from '../../middlewares/auth'
import { NotificationController } from './notification.controler'
const router=express.Router()

router.get("/",auth(),NotificationController.getAllNotificationByUser)

export const NotificationRoute=router