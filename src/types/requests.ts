import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface AddStaffRequest extends Request {
  body: {
    email: string;
    password: string;
    role: 'staff' | 'admin';
  };
  user: {
    id: string;
    email: string;
  };
}

export interface DeleteUserRequest extends Request {
  params: {
    id: string;
  };
  user: {
    id: string;
    email: string;
  };
}

export interface DeactivateUserRequest extends Request {
  params: {
    id: string;
  };
  user: {
    id: string;
    email: string;
  };
}

export interface ReactivateUserRequest extends Request {
  params: {
    id: string;
  };
  user: {
    id: string;
    email: string;
  };
}

export interface GetAllUsersRequest extends Request {
  query: {
    includeInactive?: string;
    role?: 'admin' | 'staff' | 'voter';
  };
}

