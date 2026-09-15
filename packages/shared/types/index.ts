import {
  calculateNetClaimValue,
  getCmeDeficit,
  getPatientAge,
  isCmeCompliant,
  isHighRiskOfNoShow,
  isRejectedClaim
} from '../../../src/utils/validations';

export * from '../../../src/types/models';

import type { Appointment, Claim, Clinic, Employee, Patient } from '../../../src/types/models';

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
    return getPatientAge(this, currentYear);
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
    return isHighRiskOfNoShow(this);
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
    return isRejectedClaim(this);
  },
  calculateNetValue(taxRate: number = 0.05): number {
    return calculateNetClaimValue(this, taxRate);
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
    return isCmeCompliant(this);
  },
  getCmeDeficit(): number {
    return getCmeDeficit(this);
  }
};
