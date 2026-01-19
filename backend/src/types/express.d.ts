import type { UserRole } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: UserRole;
      };

      user?: {
        id: string;
        email: string;
        role: UserRole;
        name?: string;
        isActive?: boolean;
        registrationStatus?: string;
      };
    }
  }
}

export {};
