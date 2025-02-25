// backend-api/src/types/express/index.d.ts
import { User } from '../../models/User';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      username: string;
      role: string;
      departmentid: number | null;
      isglobalrole: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    };
  }
}




