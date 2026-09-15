/**
 * Entidades principales, interfaces y tipos compartidos para HealthCore.
 */

export type Id = string;
export type CountryCode = 'US' | 'UK';
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
export type ClaimStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type EmployeeRole = 'CLINICIAN' | 'ADMIN' | 'BILLING' | 'EXECUTIVE' | 'TECH';
export type SortOrder = 'asc' | 'desc';
export type Selector<T, V> = (item: T) => V;
export type Comparable = string | number | boolean | Date;

export interface BaseEntity {
  id: Id;
  createdAt?: string;
  updatedAt?: string;
}

export interface Clinic extends BaseEntity {
  name: string;
  country: CountryCode;
  city: string;
  ehrSystem: string;
  active: boolean;
  getFormattedLocation(): string;
  isUSClinic(): boolean;
}

export interface Patient extends BaseEntity {
  fullName: string;
  dateOfBirth: string;
  country: CountryCode;
  primaryClinicId: Id;
  preferredLanguage: string;
  getAge(currentYear?: number): number;
  getSummary(): string;
}

export interface Appointment extends BaseEntity {
  patientId: Id;
  clinicId: Id;
  clinicianId: Id;
  dateTime: string;
  status: AppointmentStatus;
  noShowRiskScore: number;
  isHighRiskOfNoShow(): boolean;
  formatDetails(): string;
}

export interface Claim extends BaseEntity {
  appointmentId: Id;
  amountUSD: number;
  status: ClaimStatus;
  rejectionReason?: string;
  isRejected(): boolean;
  calculateNetValue(taxRate: number): number;
}

export interface Employee extends BaseEntity {
  name: string;
  role: EmployeeRole;
  department: string;
  clinicId: Id;
  cmeHoursCompleted: number;
  cmeHoursRequired: number;
  isCmeCompliant(): boolean;
  getCmeDeficit(): number;
}

export interface MetricSummaryReport {
  totalCount: number;
  sum: number;
  average: number;
  min: number;
  max: number;
}