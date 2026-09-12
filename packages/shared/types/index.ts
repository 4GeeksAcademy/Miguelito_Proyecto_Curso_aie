/**
 * Entidades Principales e Interfaces para HealthCore
 * AI Engineering · HealthCore
 */

export type Id = string;
export type CountryCode = 'US' | 'UK';
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
export type ClaimStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type EmployeeRole = 'CLINICIAN' | 'ADMIN' | 'BILLING' | 'EXECUTIVE' | 'TECH';

export interface BaseEntity {
  id: Id;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 1. Clínica (Clinic)
 */
export interface Clinic extends BaseEntity {
  name: string;
  country: CountryCode;
  city: string;
  ehrSystem: string;
  active: boolean;
  getFormattedLocation(): string;
  isUSClinic(): boolean;
}

/**
 * 2. Paciente (Patient)
 */
export interface Patient extends BaseEntity {
  fullName: string;
  dateOfBirth: string; // ISO Format YYYY-MM-DD
  country: CountryCode;
  primaryClinicId: Id;
  preferredLanguage: string;
  getAge(currentYear?: number): number;
  getSummary(): string;
}

/**
 * 3. Cita Médica (Appointment)
 */
export interface Appointment extends BaseEntity {
  patientId: Id;
  clinicId: Id;
  clinicianId: Id;
  dateTime: string; // ISO Format
  status: AppointmentStatus;
  noShowRiskScore: number; // 0.0 a 1.0
  isHighRiskOfNoShow(): boolean;
  formatDetails(): string;
}

/**
 * 4. Reclamación / Factura (Claim)
 */
export interface Claim extends BaseEntity {
  appointmentId: Id;
  amountUSD: number;
  status: ClaimStatus;
  rejectionReason?: string;
  isRejected(): boolean;
  calculateNetValue(taxRate: number): number;
}

/**
 * 5. Empleado / Personal (Employee)
 */
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

/**
 * Instancias concretas con objetos literales
 */
export const sampleClinicUS: Clinic = {
  id: 'cli-001',
  name: 'HealthCore Austin Central',
  country: 'US',
  city: 'Austin',
  ehrSystem: 'EHR-US-Primary',
  active: true,
  createdAt: '2011-03-15T08:00:00Z',
  getFormattedLocation(): string {
    return `${this.name} (${this.city}, ${this.country})`;
  },
  isUSClinic(): boolean {
    return this.country === 'US';
  }
};

export const sampleClinicUK: Clinic = {
  id: 'cli-002',
  name: 'HealthCore London City',
  country: 'UK',
  city: 'Londres',
  ehrSystem: 'EHR-UK-NHS-Bridge',
  active: true,
  createdAt: '2018-06-20T08:00:00Z',
  getFormattedLocation(): string {
    return `${this.name} (${this.city}, ${this.country})`;
  },
  isUSClinic(): boolean {
    return this.country === 'US';
  }
};

export const samplePatient: Patient = {
  id: 'pat-101',
  fullName: 'María García',
  dateOfBirth: '1985-04-12',
  country: 'US',
  primaryClinicId: 'cli-001',
  preferredLanguage: 'Español',
  createdAt: '2023-01-10T10:00:00Z',
  getAge(currentYear: number = 2026): number {
    const birthYear = parseInt(this.dateOfBirth.split('-')[0], 10);
    return currentYear - birthYear;
  },
  getSummary(): string {
    return `Paciente: ${this.fullName} | Idioma: ${this.preferredLanguage} | Clínica: ${this.primaryClinicId}`;
  }
};

export const sampleAppointment: Appointment = {
  id: 'app-501',
  patientId: 'pat-101',
  clinicId: 'cli-001',
  clinicianId: 'emp-301',
  dateTime: '2026-09-15T10:30:00Z',
  status: 'SCHEDULED',
  noShowRiskScore: 0.78,
  isHighRiskOfNoShow(): boolean {
    return this.noShowRiskScore >= 0.70;
  },
  formatDetails(): string {
    return `Cita ${this.id} - Estado: ${this.status} - Riesgo No-Show: ${(this.noShowRiskScore * 100).toFixed(0)}%`;
  }
};

export const sampleClaim: Claim = {
  id: 'clm-801',
  appointmentId: 'app-501',
  amountUSD: 250.00,
  status: 'REJECTED',
  rejectionReason: 'Código de procedimiento inconsistente',
  createdAt: '2026-09-16T14:00:00Z',
  isRejected(): boolean {
    return this.status === 'REJECTED';
  },
  calculateNetValue(taxRate: number = 0.05): number {
    return this.amountUSD * (1 - taxRate);
  }
};

export const sampleEmployee: Employee = {
  id: 'emp-301',
  name: 'Dr. Marcus Reid',
  role: 'CLINICIAN',
  department: 'Operaciones Clínicas',
  clinicId: 'cli-001',
  cmeHoursCompleted: 35,
  cmeHoursRequired: 50,
  createdAt: '2015-09-01T08:00:00Z',
  isCmeCompliant(): boolean {
    return this.cmeHoursCompleted >= this.cmeHoursRequired;
  },
  getCmeDeficit(): number {
    const deficit = this.cmeHoursRequired - this.cmeHoursCompleted;
    return deficit > 0 ? deficit : 0;
  }
};
