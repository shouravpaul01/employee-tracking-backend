import bcrypt from "bcrypt";
import prisma from "../../shared/prisma";
import { User, UserRole, UserStatus } from "@prisma/client";

export const initiateSuperAdmin = async () => {
  const payload = {
    name: "Admin" as string,
    email: "admin@gmail.com" as string,
    role: UserRole.ADMIN,
  };
  const hashPassword = await bcrypt.hash("12345678", 12);
  const existAdmin = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existAdmin) {
    return;
  }

  await prisma.user.create({
    data: { ...payload, credential: { create: { password: hashPassword } } },
  });
};
