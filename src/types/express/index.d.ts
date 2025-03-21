// backend-api/src/types/express/index.d.ts
import { User } from '../../models/User';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: number;
      username: string;
      role: string;
      departmentId: number | null;
      isglobalrole: boolean;
      createdAt?: Date;
      updatedAt?: Date;
      permissions?: {
        [module: string]: {
          read: boolean;
          write: boolean;
        };
    };
  }
}
}



