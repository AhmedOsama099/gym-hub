export interface IPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  type: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IUpsertPlan {
  id?: string;
  name: string;
  price: number;
  duration: number;
  type: string;
  description?: string;
}

export interface IPlansResponse {
  message: string;
  plans: IPlan[];
}

export interface IUpsertPlanResponse {
  message: string;
  plan: IPlan;
}
