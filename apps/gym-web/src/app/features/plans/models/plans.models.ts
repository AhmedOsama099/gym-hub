export interface IPlan {
  id: number;
  name: string;
  price: number;
  duration: number;
  type: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreatePlan {
  name: string;
  price: number;
  duration: number;
  type: string;
  description?: string;
}
