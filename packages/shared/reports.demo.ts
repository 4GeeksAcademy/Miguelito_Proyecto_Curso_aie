/**
 * Ejemplo de uso del módulo de reportes - HealthCore
 */

import {
  countByCategory,
  sumBy,
  averageBy,
  generateMetricReport
} from '../../src/utils/transformations';

import {
  Appointment,
  Claim,
  Employee
} from '../../src/types/models';

// Colección de ejemplo: Citas médicas
const appointments: Appointment[] = [
  {
    id: 'app-001',
    patientId: 'pat-101',
    clinicId: 'cli-001',
    clinicianId: 'emp-301',
    dateTime: '2026-09-12T09:00:00Z',
    status: 'SCHEDULED',
    noShowRiskScore: 0.82,
    isHighRiskOfNoShow(): boolean { return this.noShowRiskScore >= 0.7; },
    formatDetails(): string { return `App ${this.id}`; }
  },
  {
    id: 'app-002',
    patientId: 'pat-102',
    clinicId: 'cli-001',
    clinicianId: 'emp-301',
    dateTime: '2026-09-12T10:00:00Z',
    status: 'COMPLETED',
    noShowRiskScore: 0.15,
    isHighRiskOfNoShow(): boolean { return this.noShowRiskScore >= 0.7; },
    formatDetails(): string { return `App ${this.id}`; }
  },
  {
    id: 'app-003',
    patientId: 'pat-103',
    clinicId: 'cli-002',
    clinicianId: 'emp-302',
    dateTime: '2026-09-12T11:00:00Z',
    status: 'NO_SHOW',
    noShowRiskScore: 0.90,
    isHighRiskOfNoShow(): boolean { return this.noShowRiskScore >= 0.7; },
    formatDetails(): string { return `App ${this.id}`; }
  }
];

// Colección de ejemplo: Reclamaciones / Facturas
const claims: Claim[] = [
  {
    id: 'clm-001',
    appointmentId: 'app-001',
    amountUSD: 350.0,
    status: 'SUBMITTED',
    isRejected(): boolean { return this.status === 'REJECTED'; },
    calculateNetValue(tax: number = 0.05): number { return this.amountUSD * (1 - tax); }
  },
  {
    id: 'clm-002',
    appointmentId: 'app-002',
    amountUSD: 150.0,
    status: 'APPROVED',
    isRejected(): boolean { return this.status === 'REJECTED'; },
    calculateNetValue(tax: number = 0.05): number { return this.amountUSD * (1 - tax); }
  },
  {
    id: 'clm-003',
    appointmentId: 'app-003',
    amountUSD: 500.0,
    status: 'REJECTED',
    rejectionReason: 'Falta código de procedimiento',
    isRejected(): boolean { return this.status === 'REJECTED'; },
    calculateNetValue(tax: number = 0.05): number { return this.amountUSD * (1 - tax); }
  }
];

// 1. Conteo por categoría: Estado de Citas
export const appointmentsByStatus = countByCategory(appointments, (a) => a.status);

// 2. Conteo por categoría: Estado de Reclamaciones
export const claimsByStatus = countByCategory(claims, (c) => c.status);

// 3. Suma de montos de reclamaciones
export const totalClaimAmount = sumBy(claims, 'amountUSD');

// 4. Promedio de riesgo de no-show en citas
export const avgNoShowRisk = averageBy(appointments, (a) => a.noShowRiskScore);

// 5. Reporte métrico completo para montos de facturación
export const claimAmountReport = generateMetricReport(claims, 'amountUSD');
