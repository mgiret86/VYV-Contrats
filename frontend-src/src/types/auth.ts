export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
  isActive: boolean;
  alertsEnabled: boolean;
  alertDaysBefore: number;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'MANAGER' | 'VIEWER';
    isActive: boolean;
    alertsEnabled: boolean;
    alertDaysBefore: number;
  };
  accessToken: string;
  refreshToken: string;
}

export function mapApiUser(raw: LoginResponse['user']): User {
  return {
    ...raw,
    fullName: `${raw.firstName} ${raw.lastName}`,
  };
}
