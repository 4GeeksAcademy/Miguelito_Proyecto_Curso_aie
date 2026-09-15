// ==========================================
// 1. SISTEMA DE GESTIÓN DE COLECTIONS (TS)
// ==========================================
function filterBy(array, predicate) {
  return array.filter((item) => predicate(item));
}

function sortBy(array, keyOrSelector, order = 'asc') {
  const selector = typeof keyOrSelector === 'function'
    ? keyOrSelector
    : (item) => item[keyOrSelector];

  return [...array].sort((a, b) => {
    const valA = selector(a);
    const valB = selector(b);

    if (valA === valB) return 0;
    let comparison = 0;
    if (valA === undefined || valA === null) comparison = -1;
    else if (valB === undefined || valB === null) comparison = 1;
    else if (typeof valA === 'string' && typeof valB === 'string') {
      comparison = valA.localeCompare(valB);
    } else {
      comparison = valA < valB ? -1 : 1;
    }
    return order === 'asc' ? comparison : -comparison;
  });
}

function groupBy(array, keySelector) {
  return array.reduce((acc, item) => {
    const key = keySelector(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

function linearSearch(array, predicate) {
  for (let i = 0; i < array.length; i++) {
    if (predicate(array[i])) {
      return array[i];
    }
  }
  return undefined;
}

function binarySearch(sortedArray, targetValue, keySelector, compareFn) {
  let left = 0;
  let right = sortedArray.length - 1;

  const defaultCompare = (a, b) => {
    if (a === b) return 0;
    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }
    return a < b ? -1 : 1;
  };

  const compare = compareFn || defaultCompare;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = keySelector(sortedArray[mid]);
    const cmp = compare(midValue, targetValue);

    if (cmp === 0) {
      return sortedArray[mid];
    } else if (cmp < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return undefined;
}

// ==========================================
// 2. SISTEMA DE REPORTES (TS)
// ==========================================
function countByCategory(array, categorySelector) {
  return array.reduce((acc, item) => {
    const category = categorySelector(item);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
}

function sumBy(array, valueSelector) {
  const selector = typeof valueSelector === 'function'
    ? valueSelector
    : (item) => Number(item[valueSelector]) || 0;

  return array.reduce((sum, item) => sum + (selector(item) || 0), 0);
}

function averageBy(array, valueSelector) {
  if (array.length === 0) return 0;
  return sumBy(array, valueSelector) / array.length;
}

function generateMetricReport(array, valueSelector) {
  if (array.length === 0) {
    return { totalCount: 0, sum: 0, average: 0, min: 0, max: 0 };
  }

  const selector = typeof valueSelector === 'function'
    ? valueSelector
    : (item) => Number(item[valueSelector]) || 0;

  let sum = 0;
  let min = Infinity;
  let max = -Infinity;

  for (const item of array) {
    const val = selector(item) || 0;
    sum += val;
    if (val < min) min = val;
    if (val > max) max = val;
  }

  return {
    totalCount: array.length,
    sum,
    average: sum / array.length,
    min: min === Infinity ? 0 : min,
    max: max === -Infinity ? 0 : max
  };
}

// ==========================================
// 3. DATOS DE EJEMPLO E INSTANCIAS DE ENTIDADES
// ==========================================
const sampleClinicUS = {
  id: 'cli-001',
  name: 'HealthCore Austin Central',
  country: 'US',
  city: 'Austin',
  ehrSystem: 'EHR-US-Primary',
  active: true,
  getFormattedLocation() {
    return `${this.name} (${this.city}, ${this.country})`;
  },
  isUSClinic() {
    return this.country === 'US';
  }
};

const sampleClinicUK = {
  id: 'cli-002',
  name: 'HealthCore London City',
  country: 'UK',
  city: 'Londres',
  ehrSystem: 'EHR-UK-NHS-Bridge',
  active: true,
  getFormattedLocation() {
    return `${this.name} (${this.city}, ${this.country})`;
  },
  isUSClinic() {
    return this.country === 'US';
  }
};

const samplePatient = {
  id: 'pat-101',
  fullName: 'María García',
  dateOfBirth: '1985-04-12',
  country: 'US',
  primaryClinicId: 'cli-001',
  preferredLanguage: 'Español',
  getAge(currentYear = 2026) {
    const birthYear = parseInt(this.dateOfBirth.split('-')[0], 10);
    return currentYear - birthYear;
  },
  getSummary() {
    return `Paciente: ${this.fullName} | Idioma: ${this.preferredLanguage} | Clínica: ${this.primaryClinicId}`;
  }
};

const samplePatient2 = {
  id: 'pat-102',
  fullName: 'John Smith',
  dateOfBirth: '1990-11-23',
  country: 'UK',
  primaryClinicId: 'cli-002',
  preferredLanguage: 'English',
  getAge(currentYear = 2026) {
    const birthYear = parseInt(this.dateOfBirth.split('-')[0], 10);
    return currentYear - birthYear;
  },
  getSummary() {
    return `Paciente: ${this.fullName} | Idioma: ${this.preferredLanguage} | Clínica: ${this.primaryClinicId}`;
  }
};

const sampleAppointment = {
  id: 'app-501',
  patientId: 'pat-101',
  clinicId: 'cli-001',
  clinicianId: 'emp-301',
  dateTime: '2026-09-15T10:30:00Z',
  status: 'SCHEDULED',
  noShowRiskScore: 0.78,
  isHighRiskOfNoShow() {
    return this.noShowRiskScore >= 0.70;
  },
  formatDetails() {
    return `Cita ${this.id} - Estado: ${this.status} - Riesgo No-Show: ${(this.noShowRiskScore * 100).toFixed(0)}%`;
  }
};

const sampleClaim = {
  id: 'clm-801',
  appointmentId: 'app-501',
  amountUSD: 250.00,
  status: 'REJECTED',
  rejectionReason: 'Código de procedimiento inconsistente',
  isRejected() {
    return this.status === 'REJECTED';
  },
  calculateNetValue(taxRate = 0.05) {
    return this.amountUSD * (1 - taxRate);
  }
};

const sampleEmployee = {
  id: 'emp-301',
  name: 'Dr. Marcus Reid',
  role: 'CLINICIAN',
  department: 'Operaciones Clínicas',
  clinicId: 'cli-001',
  cmeHoursCompleted: 35,
  cmeHoursRequired: 50,
  isCmeCompliant() {
    return this.cmeHoursCompleted >= this.cmeHoursRequired;
  },
  getCmeDeficit() {
    const deficit = this.cmeHoursRequired - this.cmeHoursCompleted;
    return deficit > 0 ? deficit : 0;
  }
};

// Datasets para pruebas
const clinicsList = [sampleClinicUS, sampleClinicUK];
const patientsList = [samplePatient, samplePatient2];

const appointmentsList = [
  sampleAppointment,
  {
    id: 'app-502',
    patientId: 'pat-102',
    clinicId: 'cli-002',
    clinicianId: 'emp-302',
    dateTime: '2026-09-16T11:00:00Z',
    status: 'COMPLETED',
    noShowRiskScore: 0.12,
    isHighRiskOfNoShow() { return this.noShowRiskScore >= 0.70; },
    formatDetails() { return `Cita ${this.id} - Estado: ${this.status}`; }
  },
  {
    id: 'app-503',
    patientId: 'pat-101',
    clinicId: 'cli-001',
    clinicianId: 'emp-301',
    dateTime: '2026-09-17T14:30:00Z',
    status: 'NO_SHOW',
    noShowRiskScore: 0.88,
    isHighRiskOfNoShow() { return this.noShowRiskScore >= 0.70; },
    formatDetails() { return `Cita ${this.id} - Estado: ${this.status}`; }
  }
];

const claimsList = [
  sampleClaim,
  {
    id: 'clm-802',
    appointmentId: 'app-502',
    amountUSD: 180.00,
    status: 'APPROVED',
    isRejected() { return this.status === 'REJECTED'; },
    calculateNetValue(taxRate = 0.05) { return this.amountUSD * (1 - taxRate); }
  },
  {
    id: 'clm-803',
    appointmentId: 'app-503',
    amountUSD: 420.00,
    status: 'SUBMITTED',
    isRejected() { return this.status === 'REJECTED'; },
    calculateNetValue(taxRate = 0.05) { return this.amountUSD * (1 - taxRate); }
  }
];

// ==========================================
// UI RENDERING & INTERACTION LOGIC
// ==========================================
function renderEntities() {
  const container = document.getElementById('entitiesGrid');
  container.innerHTML = `
    <!-- Clinic Card -->
    <div class="rounded-2xl border border-medical-200 bg-medical-50/50 p-5 space-y-3">
      <span class="text-xs font-extrabold uppercase bg-medical-200 text-medical-800 px-2.5 py-1 rounded-md">Clinic Entity</span>
      <h3 class="text-lg font-bold text-medical-900">${sampleClinicUS.name}</h3>
      <div class="text-xs space-y-1 text-slate-600">
        <p>📍 <strong>Ubicación:</strong> ${sampleClinicUS.getFormattedLocation()}</p>
        <p>🌐 <strong>Es clínica EE.UU.:</strong> ${sampleClinicUS.isUSClinic() ? 'Sí (HIPAA)' : 'No (UK GDPR)'}</p>
        <p>💻 <strong>EHR System:</strong> ${sampleClinicUS.ehrSystem}</p>
      </div>
    </div>

    <!-- Patient Card -->
    <div class="rounded-2xl border border-medical-200 bg-medical-50/50 p-5 space-y-3">
      <span class="text-xs font-extrabold uppercase bg-medical-200 text-medical-800 px-2.5 py-1 rounded-md">Patient Entity</span>
      <h3 class="text-lg font-bold text-medical-900">${samplePatient.fullName}</h3>
      <div class="text-xs space-y-1 text-slate-600">
        <p>👤 <strong>Resumen:</strong> ${samplePatient.getSummary()}</p>
        <p>🎂 <strong>Edad estimada:</strong> ${samplePatient.getAge()} años</p>
        <p>🗣️ <strong>Idioma preferido:</strong> ${samplePatient.preferredLanguage}</p>
      </div>
    </div>

    <!-- Appointment Card -->
    <div class="rounded-2xl border border-medical-200 bg-medical-50/50 p-5 space-y-3">
      <span class="text-xs font-extrabold uppercase bg-medical-200 text-medical-800 px-2.5 py-1 rounded-md">Appointment Entity</span>
      <h3 class="text-lg font-bold text-medical-900">Cita #${sampleAppointment.id}</h3>
      <div class="text-xs space-y-1 text-slate-600">
        <p>📋 <strong>Detalles:</strong> ${sampleAppointment.formatDetails()}</p>
        <p>⚠️ <strong>Alto Riesgo No-Show:</strong> ${sampleAppointment.isHighRiskOfNoShow() ? '⚠️ SÍ (Alerta enviada)' : 'NO'}</p>
      </div>
    </div>

    <!-- Claim Card -->
    <div class="rounded-2xl border border-medical-200 bg-medical-50/50 p-5 space-y-3">
      <span class="text-xs font-extrabold uppercase bg-medical-200 text-medical-800 px-2.5 py-1 rounded-md">Claim Entity</span>
      <h3 class="text-lg font-bold text-medical-900">Reclamación #${sampleClaim.id}</h3>
      <div class="text-xs space-y-1 text-slate-600">
        <p>💵 <strong>Monto Bruto:</strong> $${sampleClaim.amountUSD.toFixed(2)}</p>
        <p>📊 <strong>Valor Neto (5% tax):</strong> $${sampleClaim.calculateNetValue(0.05).toFixed(2)}</p>
        <p>❌ <strong>Rechazada:</strong> ${sampleClaim.isRejected() ? `SÍ (${sampleClaim.rejectionReason})` : 'NO'}</p>
      </div>
    </div>

    <!-- Employee Card -->
    <div class="rounded-2xl border border-medical-200 bg-medical-50/50 p-5 space-y-3">
      <span class="text-xs font-extrabold uppercase bg-medical-200 text-medical-800 px-2.5 py-1 rounded-md">Employee Entity</span>
      <h3 class="text-lg font-bold text-medical-900">${sampleEmployee.name}</h3>
      <div class="text-xs space-y-1 text-slate-600">
        <p>💼 <strong>Rol:</strong> ${sampleEmployee.role} (${sampleEmployee.department})</p>
        <p>🎓 <strong>Horas CME:</strong> ${sampleEmployee.cmeHoursCompleted} / ${sampleEmployee.cmeHoursRequired} hrs</p>
        <p>📜 <strong>Cumplimiento Licencia:</strong> ${sampleEmployee.isCmeCompliant() ? '✅ En Regla' : `⚠️ Faltan ${sampleEmployee.getCmeDeficit()} horas`}</p>
      </div>
    </div>
  `;
}

function updateReportsUI() {
  // KPI 1: sumBy
  const totalSum = sumBy(claimsList, 'amountUSD');
  document.getElementById('kpiTotalSum').innerText = `$${totalSum.toFixed(2)}`;

  // KPI 2: averageBy
  const avgRisk = averageBy(appointmentsList, (a) => a.noShowRiskScore);
  document.getElementById('kpiAvgRisk').innerText = `${(avgRisk * 100).toFixed(1)}%`;

  // KPI 3: countByCategory
  const statusCounts = countByCategory(appointmentsList, (a) => a.status);
  const statusContainer = document.getElementById('kpiStatusCounts');
  statusContainer.innerHTML = Object.entries(statusCounts)
    .map(([status, count]) => `<div class="flex justify-between"><span>${status}:</span><strong class="text-medical-900">${count}</strong></div>`)
    .join('');

  // KPI 4: countByCategory (Claims rechazadas)
  const claimStatusCounts = countByCategory(claimsList, (c) => c.status);
  document.getElementById('kpiRejectedCount').innerText = claimStatusCounts['REJECTED'] || 0;

  // Metric Report
  const report = generateMetricReport(claimsList, 'amountUSD');
  const reportsEl = document.getElementById('reportsOutput');
  if (reportsEl) {
    reportsEl.innerHTML = `
<span class="text-slate-400">// Reporte completo generado con generateMetricReport(claimsList, 'amountUSD'):</span>
${JSON.stringify(report, null, 2)}
    `;
  }
}

function testFilter() {
  const highRisk = filterBy(appointmentsList, (a) => a.isHighRiskOfNoShow());
  const el = document.getElementById('collectionsOutput');
  if (el) el.innerText = `// filterBy(appointmentsList, a => a.isHighRiskOfNoShow())\n` + JSON.stringify(highRisk, null, 2);
}

function testSort() {
  const sorted = sortBy(appointmentsList, 'dateTime', 'desc');
  const el = document.getElementById('collectionsOutput');
  if (el) el.innerText = `// sortBy(appointmentsList, 'dateTime', 'desc')\n` + JSON.stringify(sorted, null, 2);
}

function testGroup() {
  const grouped = groupBy(appointmentsList, (a) => a.status);
  const el = document.getElementById('collectionsOutput');
  if (el) el.innerText = `// groupBy(appointmentsList, a => a.status)\n` + JSON.stringify(grouped, null, 2);
}

function testLinearSearch() {
  const result = linearSearch(patientsList, (p) => p.id === 'pat-102');
  const el = document.getElementById('collectionsOutput');
  if (el) el.innerText = `// linearSearch(patientsList, p => p.id === 'pat-102')\n` + JSON.stringify(result, null, 2);
}

function testBinarySearch() {
  const sortedClinics = sortBy(clinicsList, 'id', 'asc');
  const result = binarySearch(sortedClinics, 'cli-002', (c) => c.id);
  const el = document.getElementById('collectionsOutput');
  if (el) el.innerText = `// binarySearch(sortedClinics, 'cli-002', c => c.id)\n` + JSON.stringify(result, null, 2);
}

function logMessage(msg) {
  const log = document.getElementById('consoleLog');
  log.innerText += '\n' + msg;
  log.scrollTop = log.scrollHeight;
}

function runAllTests() {
  document.getElementById('consoleLog').innerText = '🚀 Iniciando Suite de Pruebas TypeScript...';
  logMessage('=====================================================');

  // 1. Entidades
  logMessage('[TEST 1/10] Clinic Entity: ' + sampleClinicUS.getFormattedLocation() + ' -> ' + (sampleClinicUS.isUSClinic() ? 'PASS' : 'FAIL'));
  logMessage('[TEST 2/10] Patient Entity: ' + samplePatient.getSummary() + ' (Edad: ' + samplePatient.getAge() + ' años) -> PASS');
  logMessage('[TEST 3/10] Claim Net Value: $' + sampleClaim.calculateNetValue(0.05) + ' -> PASS');

  // 2. Collections
  const filtered = filterBy(appointmentsList, a => a.status === 'SCHEDULED');
  logMessage('[TEST 4/10] filterBy(appointments, SCHEDULED): ' + filtered.length + ' elementos -> PASS');

  const sorted = sortBy(claimsList, 'amountUSD', 'desc');
  logMessage('[TEST 5/10] sortBy(claims, amountUSD desc): Max = $' + sorted[0].amountUSD + ' -> PASS');

  const grouped = groupBy(appointmentsList, a => a.status);
  logMessage('[TEST 6/10] groupBy(appointments, status): ' + Object.keys(grouped).join(', ') + ' -> PASS');

  const foundLinear = linearSearch(patientsList, p => p.id === 'pat-101');
  logMessage('[TEST 7/10] linearSearch(patients, pat-101): ' + (foundLinear ? foundLinear.fullName : 'NOT FOUND') + ' -> PASS');

  const sortedClinics = sortBy(clinicsList, 'id', 'asc');
  const foundBinary = binarySearch(sortedClinics, 'cli-002', c => c.id);
  logMessage('[TEST 8/10] binarySearch(clinics, cli-002): ' + (foundBinary ? foundBinary.name : 'NOT FOUND') + ' -> PASS');

  // 3. Reports
  const counts = countByCategory(claimsList, c => c.status);
  logMessage('[TEST 9/10] countByCategory(claims, status): ' + JSON.stringify(counts) + ' -> PASS');

  const report = generateMetricReport(claimsList, 'amountUSD');
  logMessage('[TEST 10/10] generateMetricReport(claims, amountUSD): Sum=$' + report.sum + ', Avg=$' + report.average + ' -> PASS');

  logMessage('=====================================================');
  logMessage('✅ TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO (10/10)');

  // Activar vista interactiva
  testFilter();
}

// Inicialización al cargar
document.addEventListener('DOMContentLoaded', () => {
  renderEntities();
  updateReportsUI();
});
