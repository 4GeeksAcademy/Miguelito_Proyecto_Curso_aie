import type { Appointment, Claim, Employee, Patient } from '../types/models';

export const HIGH_NO_SHOW_RISK_THRESHOLD = 0.7;

export function isHighRiskOfNoShow(appointment: Pick<Appointment, 'noShowRiskScore'>): boolean {
  return appointment.noShowRiskScore >= HIGH_NO_SHOW_RISK_THRESHOLD;
}

export function isRejectedClaim(claim: Pick<Claim, 'status'>): boolean {
  return claim.status === 'REJECTED';
}

export function calculateNetClaimValue(
  claim: Pick<Claim, 'amountUSD'>,
  taxRate: number = 0.05
): number {
  return claim.amountUSD * (1 - taxRate);
}

export function isCmeCompliant(
  employee: Pick<Employee, 'cmeHoursCompleted' | 'cmeHoursRequired'>
): boolean {
  return employee.cmeHoursCompleted >= employee.cmeHoursRequired;
}

export function getCmeDeficit(
  employee: Pick<Employee, 'cmeHoursCompleted' | 'cmeHoursRequired'>
): number {
  const deficit: number = employee.cmeHoursRequired - employee.cmeHoursCompleted;

  return deficit > 0 ? deficit : 0;
}

export function getPatientAge(patient: Pick<Patient, 'dateOfBirth'>, currentYear: number = 2026): number {
  const birthYear: number = Number.parseInt(patient.dateOfBirth.split('-')[0], 10);

  return currentYear - birthYear;
}