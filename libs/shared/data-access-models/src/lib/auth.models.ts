export enum UserRole {
  ADMIN = "ADMIN",
  TRAINER = "TRAINER",
  MEMBER = "MEMBER",
}

export interface IRegisterRequest {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt?: string;
}

export interface ILoginResponse {
  user: ILoginRequest;
  token: string;
}
