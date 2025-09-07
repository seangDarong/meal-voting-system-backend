import { Request } from 'express';
import { UserAttributes } from '@/models/user';

//admin

export interface AuthenticatedRequest extends Request {
  // user?: UserAttributes
}

export interface AddStaffRequest extends AuthenticatedRequest {
  body: {
    email: string;
    password: string;
    role: 'staff' | 'admin';
  }; 
}

export interface DeleteUserRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
}

export interface DeactivateUserRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
}

export interface ReactivateUserRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
}

export interface GetAllUsersRequest extends AuthenticatedRequest {
  query: {
    includeInactive?: string;
    role?: 'admin' | 'staff' | 'voter';
  };
}

export interface DeleteFeedbackRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
}

//canteen.ts
export interface SubmitVoteOptionsRequest extends AuthenticatedRequest {
  body: {
    mealDate: string;
    dishIds: number[];
  };
}

export interface GetActiveVotePollRequest extends AuthenticatedRequest {
}

export interface GetTodayVoteResultRequest extends AuthenticatedRequest {
  
}

export interface GetUpCommingMealRequest extends AuthenticatedRequest {
  
}


export interface FinalizeVotePollRequest extends AuthenticatedRequest {
  params: {
    id : string;
  }
  body: {
    selectedDishIds : number[];
  }
}

//dish.ts

export interface AddDishRequest extends AuthenticatedRequest {
  body: {
    name?: string;
    name_kh?: string;
    categoryId: string;
    ingredient?: string;
    ingredient_kh?: string;
    description?: string;
    description_kh?: string;
  };
  file?: Express.Multer.File;
}

export interface UpdateDishRequest extends AuthenticatedRequest {
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
  file?: Express.Multer.File;
}

export interface DeleteDishRequest extends AuthenticatedRequest {
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


export interface GetOwnProfileRequest extends AuthenticatedRequest {
}

export interface SetupGraduationDateRequest extends AuthenticatedRequest {
  body: {
    generation: string;
  };
}

//wishlist.ts

export interface GetMyWishRequest extends AuthenticatedRequest {
}

export interface UpdateWishRequest extends AuthenticatedRequest {
  body: {
    dishId?: number;
  };
}

export interface RemoveWishRequest extends AuthenticatedRequest {
}

export interface GetAllWishesRequest extends AuthenticatedRequest {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  };
}

//vote 

export interface CastVoteRequest extends AuthenticatedRequest {
  body:{
    dishId?: number;
  }
}

export interface UpdateVoteRequest extends AuthenticatedRequest {
  body:{
    dishId?: number;
  }
}

//get vote history
export interface GetUserVoteHistoryRequest extends AuthenticatedRequest {
  body:{
    date?: string;
  }
}

//get vote history
export interface GetTodayVotePoll extends AuthenticatedRequest {

}