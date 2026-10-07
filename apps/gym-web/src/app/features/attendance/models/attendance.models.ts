// 1. كائن الطلب لتسجيل الدخول
export interface ICheckInRequest {
  identifier: string; // Phone number or User UUID
}

// 2. تفاصيل العضو والباقة داخل رد الـ Check-in الناجح
export interface ICheckInMemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface ICheckInPlanSummary {
  name: string;
  endDate: string;
  remainingDays: number;
}

export interface ICheckInResultData {
  attendanceId: string;
  checkInAt: string;
  member: ICheckInMemberSummary;
  plan: ICheckInPlanSummary;
}

export interface ICheckInResponse {
  message: string;
  data: ICheckInResultData;
}

// 3. بنية عنصر في جدول حضور اليوم (Today's Logs)
export interface ITodayAttendanceItem {
  id: string;
  checkInAt: string;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    currentPlan: string;
  };
}

export interface ITodayAttendanceResponse {
  totalToday: number;
  logs: ITodayAttendanceItem[];
}
