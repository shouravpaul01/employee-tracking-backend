export interface ICreateNotification {
  title: string;
  message: string;
  type: "EXPENSE" | "PROJECT" | "ATTENDANCE" | "SYSTEM";
  receiverId: string;
  senderId?: string;
  referenceId?: string;
  referenceType?: "PROJECT" | "EXPENSE" | "ASSIGNMENT";
}