import { Request } from 'express';
import {File } from "@/utils/r2"

//admin

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

export interface DeleteFeedbackRequest extends Request {
  params: {
    id: string;
  };
  user?: {
    id: string;
    role: string;
    email?: string;
  };
}

//canteen.ts
export interface SubmitVoteOptionsRequest extends Request {
  body: {
    mealDate: string;
    dishIds: number[];
  };
  user: {
    id: string;
  };
}

export interface GetActiveVotePollRequest extends Request {
  user?: {
    id: string;
  };
}

export interface GetTodayVoteResultRequest extends Request {
  user?: {
    id: string;
  };
}

//dish.ts

export interface AddDishRequest extends Request {
  body: {
    name?: string;
    name_kh?: string;
    categoryId: string;
    ingredient?: string;
    ingredient_kh?: string;
    description?: string;
    description_kh?: string;
  };
  file?: File;
  user: {
    id: string;
  };
}

export interface UpdateDishRequest extends Request {
  params: {
    id: string;
  };
  body: {
    name?: string;
    name_kh?: string;
    description?: string;
    description_kh?: string;
    ingredient?: string;
    ingredient_kh?: string;
    categoryId?: string;
  };
  file?: File;
}

export interface DeleteDishRequest extends Request {
  params: {
    id: string;
  };
}

export interface GetDishesByCategoryRequest extends Request {
  params: {
    categoryId: string;
  };
}


//feedback.ts

export interface CreateFeedbackRequest extends Request {
  body: {
    canteen?: number;
    system?: number;
    content?: string;
  };
}

export interface GetFeedbackRequest extends Request {
  query: {
    limit?: string;
    offset?: string;
  };
}

//users.ts

export interface StaffLoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

export interface DeactivateOwnAccountRequest extends Request {
  body: {
    confirmPassword: string;
  };
  user: {
    id: string;
    email?: string;
  };
}

export interface GetOwnProfileRequest extends Request {
  user: {
    id: string;
  };
}

export interface SetupGraduationDateRequest extends Request {
  body: {
    generation: string;
  };
  user: {
    id: string;
  };
}

//wishlist.ts

export interface GetMyWishRequest extends Request {
  user: {
    id: string;
  };
}

export interface UpdateWishRequest extends Request {
  body: {
    dishId?: number;
  };
  user: {
    id: string;
  };
}

export interface RemoveWishRequest extends Request {
  user: {
    id: string;
  };
}

export interface GetAllWishesRequest extends Request {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}
