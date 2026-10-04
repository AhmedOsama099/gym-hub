export enum GenderType {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  EXPIRED = "EXPIRED",
  FROZEN = "FROZEN",
  CANCELLED = "CANCELLED",
}

export interface IMemberPlan {
  id?: string;
  name: string;
  type: string;
  duration?: number;
  price?: number;
}

// شكل الاشتراك العائد مع العضو
export interface IMemberSubscription {
  id: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  plan: IMemberPlan;
}

export interface IMember {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string | null;
  gender: GenderType | null;
  dateOfBirth?: string | null;
  createdAt: string;
  subscriptions: IMemberSubscription[];
}

export interface ICreateMemberRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  gender: GenderType;
  dateOfBirth: string;
  planId: string;
  startDate?: string;
}

export interface IUpdateMemberRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  gender?: GenderType;
  dateOfBirth?: string;
}

export interface IRenewSubscriptionRequest {
  planId: string;
  startDate?: string;
}
