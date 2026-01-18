import { Role } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      doctorId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    doctorId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    doctorId?: string;
  }
}
