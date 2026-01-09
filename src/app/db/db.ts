import bcrypt from "bcrypt";
import prisma from "../../shared/prisma";
import { User, UserRole, UserStatus } from "@prisma/client";

export const initiateSuperAdmin = async () => {
  const payload = {
    firstName: "Admin" as string,
    lastName: "Application",
    email: "admin@gmail.com" as string,
    phone: "1234567890" as string,
    role: UserRole.ADMIN,
    password: await bcrypt.hash("12345678", 10),
  };

  const existAdmin = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existAdmin) {
    return;
  }

  await prisma.user.create({ data: payload });
};
