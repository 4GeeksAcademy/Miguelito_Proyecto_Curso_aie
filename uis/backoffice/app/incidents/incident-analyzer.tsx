"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

type Metrics = {
  total_read: number;
  valid_count: number;
  rejected_count: number;
  category_counts: Record<string, number>;
  status_counts: Record<string, number>;
  problem_counts: Record<string, number>;
  resolution_rate_percent: number;
  mean_resolution_hours: number | null;
  mean_satisfaction_score: number | null;
  satisfaction_score_count: number;
};

type AnalysisResponse = {
  metrics: Metrics;
  errors: Array<{ row: number; reason: string }>;
};

const API_BASE_URL = "";

function CountTable({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right));
  return (
    <section className="card breakdown-card">
      <div className="card-heading"><h2>{title}</h2><span>{entries.length} tipos</span></div>
      {entries.length === 0 ? <p className="empty">Sin registros.</p> : (
        <dl className="count-list">
          {entries.map(([name, count]) => <div key={name}><dt>{name.replace(/_/g, " ")}</dt><dd>{count}</dd></div>)}
        </dl>
      )}
    </section>
  );
}

export default function IncidentAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setError("");
  }

  async function analyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Selecciona un fichero CSV para analizar.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/incidents/analyze`, { method: "POST", body });
      const payload = await response.json() as AnalysisResponse | { detail?: string };
      if (!response.ok) throw new Error("detail" in payload ? payload.detail ?? "No se pudo analizar el fichero." : "No se pudo analizar el fichero.");
      setResult(payload as AnalysisResponse);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error al conectar con la API de incidencias.");
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="topbar"><div>HealthCore <span>/</span> Operaciones <span>/</span> Incidencias</div><span className="privacy-label">Solo agregados · Sin PII</span></header>
      <div className="content">
        <div className="page-heading">
          <div><p className="eyebrow">CALIDAD Y EXPERIENCIA</p><h1>Analizador de incidencias</h1><p className="description">Carga un CSV para validar los registros y revisar métricas agregadas.</p></div>
          {result ? <a className="secondary-action" href={`${API_BASE_URL}/api/incidents/results/export`}>Descargar results.csv</a> : <span className="secondary-action" aria-disabled="true">Descargar results.csv</span>}
        </div>

        <form className="upload-card" onSubmit={analyze}>
          <label htmlFor="incident-file">Fichero CSV</label>
          <div className="upload-controls">
            <input id="incident-file" type="file" accept=".csv,text/csv" onChange={chooseFile} />
            <button className="primary-action" type="submit" disabled={busy}>{busy ? "Analizando…" : "Analizar incidencias"}</button>
          </div>
          <p className="hint">Formato esperado: incidents-HEALTHCORE.csv. El fichero solo se procesa en memoria.</p>
        </form>

        {error && <div className="alert" role="alert">{error}</div>}
        {!result && !error && <div className="empty-state">Selecciona un CSV y ejecuta el análisis para ver sus resultados.</div>}

        {result && <>
          <section className="metrics-grid" aria-label="Métricas generales">
            <article className="metric"><span>Total leídos</span><strong>{result.metrics.total_read}</strong></article>
            <article className="metric"><span>Registros válidos</span><strong>{result.metrics.valid_count}</strong></article>
            <article className="metric"><span>Registros inválidos</span><strong>{result.metrics.rejected_count}</strong></article>
            <article className="metric metric-highlight"><span>Índice de satisfacción medio</span><strong>{result.metrics.mean_satisfaction_score?.toFixed(2) ?? "N/D"}</strong><small>{result.metrics.satisfaction_score_count} puntuaciones en cerrados</small></article>
            <article className="metric"><span>Tasa de resolución</span><strong>{result.metrics.resolution_rate_percent.toFixed(2)}%</strong></article>
            <article className="metric"><span>Tiempo medio de resolución</span><strong>{result.metrics.mean_resolution_hours == null ? "N/D" : `${result.metrics.mean_resolution_hours.toFixed(2)} h`}</strong></article>
          </section>

          <div className="breakdowns">
            <CountTable title="Desglose por categoría" counts={result.metrics.category_counts} />
            <CountTable title="Desglose por estado" counts={result.metrics.status_counts} />
            <CountTable title="Registros inválidos por tipo" counts={result.metrics.problem_counts} />
          </div>

          <section className="card invalid-details">
            <div className="card-heading"><h2>Detalle de registros inválidos</h2><span>{result.errors.length} filas</span></div>
            {result.errors.length === 0 ? <p className="empty">No se encontraron registros inválidos.</p> : (
              <div className="table-wrap"><table><thead><tr><th>Fila</th><th>Tipo de problema</th><th>Detalle</th></tr></thead><tbody>
                {result.errors.map((item) => <tr key={`${item.row}-${item.reason}`}><td>{item.row}</td><td>{item.reason.split(":")[0]}</td><td>{item.reason}</td></tr>)}
              </tbody></table></div>
            )}
          </section>
        </>}
      </div>
    </>
  );
}