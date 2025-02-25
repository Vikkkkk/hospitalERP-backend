// backend-api/src/types/RequestTypes.d.ts

import { Request } from 'express';

// Define a custom interface for authenticated requests
export interface AuthenticatedUser {
  id: number;
  username: string;
  role: string;
  departmentid: number | null;
  isglobalrole: boolean;
}

// Extend Express Request to include the authenticated user
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
