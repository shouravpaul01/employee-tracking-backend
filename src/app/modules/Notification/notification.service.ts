import prisma from "../../../shared/prisma";
import QueryBuilder from "../../../helpers/queryBuilder";
import { UserRole } from "@prisma/client";

const createNotification = async ({
  title,
  message,
  type,
  senderId,
  referenceId,
  referenceType,
  receiverRole, 
  receiverId,   
}: {
  title: string;
  message: string;
  type: "EXPENSE" | "PROJECT" | "ATTENDANCE" | "SYSTEM";
  senderId?: string;
  referenceId?: string;
  referenceType?: "PROJECT" | "EXPENSE" | "ASSIGNMENT";
  receiverRole?: "ADMIN" | "EMPLOYEE";
  receiverId?: string;
}) => {
  let receivers: string[] = [];


  if (receiverId) {
    receivers = [receiverId];
  }

  if (receiverRole==UserRole.ADMIN) {
    const users = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
    });

    receivers = users.map((u) => u.id);
  }

  if (!receivers.length) return;

  const notifications = receivers.map((id) => ({
    title,
    message,
    type,
    senderId,
    receiverId: id,
    referenceId,
    referenceType,
  }));

  await prisma.notification.createMany({
    data: notifications,
  });
};
const getAllNotificationByUser = async (userId:string,query: Record<string, undefined>) => {
  const findQuery={receiverId:userId,...query}
  const queryBuilder = new QueryBuilder(prisma.notification, findQuery);
  const result =await queryBuilder
    .filter()
    .sort()
    .paginate()
    .execute();
  const meta = await queryBuilder.countTotal();
  return { data: result, meta };
};
export const NotificationService = { createNotification,getAllNotificationByUser };
