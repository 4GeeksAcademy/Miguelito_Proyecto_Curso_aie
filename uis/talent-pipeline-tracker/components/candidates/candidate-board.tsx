"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Candidate } from "@/types/candidate";

type CandidateBoardProps = {
  candidates: Candidate[];
  error?: string;
};

const statusLabels: Record<string, string> = {
  received: "Recibida",
  in_progress: "En proceso",
  discarded: "Descartada",
};

const stageLabels: Record<string, string> = {
  pending: "Pendiente",
  review: "En revisión",
  personal_interview: "Entrevista personal",
  technical_interview: "Entrevista técnica",
};

const statusFilters = [
  { value: "all", label: "Todas" },
  { value: "received", label: "Recibidas" },
  { value: "in_progress", label: "En proceso" },
  { value: "discarded", label: "Descartadas" },
];

function formatDate(value?: string) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function CandidateBoard({ candidates, error }: CandidateBoardProps) {
  const [query, setQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("all");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const requestedStatus = searchParams.get("status") ?? "all";
  const requestedStage = searchParams.get("stage") ?? "all";
  const selectedStatus = statusFilters.some(({ value }) => value === requestedStatus)
    ? requestedStatus
    : "all";
  const stages = [...new Set(candidates.map(({ stage }) => stage))].sort();
  const selectedStage = stages.includes(requestedStage) ? requestedStage : "all";

  function updateSearchParam(key: "status" | "stage", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete(key);
    else params.set(key, value);

    const queryString = params.toString();
    window.history.replaceState(
      null,
      "",
      queryString ? `${pathname}?${queryString}` : pathname,
    );
  }

  const positions = [...new Set(candidates.map(({ position }) => position))].sort(
    (first, second) => first.localeCompare(second, "es"),
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filteredCandidates = candidates.filter((candidate) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      `${candidate.full_name} ${candidate.email}`
        .toLocaleLowerCase("es")
        .includes(normalizedQuery);
    const matchesPosition =
      selectedPosition === "all" || candidate.position === selectedPosition;
    const matchesStatus =
      selectedStatus === "all" || candidate.status === selectedStatus;
    const matchesStage = selectedStage === "all" || candidate.stage === selectedStage;

    return matchesQuery && matchesPosition && matchesStatus && matchesStage;
  });

  const activeCount = candidates.filter(
    ({ status }) => status === "in_progress",
  ).length;
  const interviewCount = candidates.filter(({ stage }) =>
    stage.endsWith("interview"),
  ).length;

  return (
    <main className="workspace">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="HealthCore, inicio">
          <span className="brand-mark">H</span>
          <span className="brand-name">HealthCore</span>
        </Link>
        <div className="sidebar-section-label">TALENTO</div>
        <div className="sidebar-link sidebar-link-active">
          <span className="sidebar-link-indicator" />
          Candidaturas
        </div>
        <div className="sidebar-note">
          <span className="sidebar-note-dot" />
          <span>People &amp; Workforce</span>
        </div>
        <div className="sidebar-footer">
          <span className="sidebar-footer-label">RED CLÍNICA</span>
          <strong>12 sedes</strong>
          <span>Estados Unidos · Reino Unido</span>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">HealthCore <span>/</span> Talento</div>
          <Link className="refresh-link" href="/">Actualizar datos</Link>
        </header>

        <div className="page-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">PEOPLE &amp; WORKFORCE</p>
              <h1>Candidaturas</h1>
              <p className="page-description">
                Seguimiento de selección para los equipos clínicos y operativos de HealthCore.
              </p>
            </div>
            <div className="page-actions">
              <div className="live-indicator"><span /> Datos en vivo</div>
              <Link className="primary-action" href="/candidates/new">Nueva candidatura</Link>
            </div>
          </div>

          <section className="metrics" aria-label="Resumen de candidaturas">
            <article className="metric metric-primary">
              <span className="metric-label">Total de candidaturas</span>
              <strong className="metric-value">{candidates.length}</strong>
              <span className="metric-footnote">En todos los puestos</span>
            </article>
            <article className="metric">
              <span className="metric-label">En proceso</span>
              <strong className="metric-value">{activeCount}</strong>
              <span className="metric-footnote">Selección activa</span>
            </article>
            <article className="metric">
              <span className="metric-label">En entrevista</span>
              <strong className="metric-value">{interviewCount}</strong>
              <span className="metric-footnote">Personal o técnica</span>
            </article>
            <article className="metric">
              <span className="metric-label">Puestos con candidaturas</span>
              <strong className="metric-value">{positions.length}</strong>
              <span className="metric-footnote">Con candidaturas recibidas</span>
            </article>
          </section>

          <section className="candidate-section" aria-labelledby="list-title">
            <div className="list-heading">
              <div>
                <h2 id="list-title">Todas las candidaturas</h2>
                <p>Revisa el estado y la experiencia de cada perfil.</p>
              </div>
              <span className="result-count">{filteredCandidates.length} perfiles</span>
            </div>

            <div className="toolbar">
              <label className="search-field">
                <span className="visually-hidden">Buscar por nombre o correo electrónico</span>
                <input
                  type="search"
                  placeholder="Buscar nombre o correo electrónico"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label className="position-filter">
                <span className="visually-hidden">Filtrar por puesto</span>
                <select
                  value={selectedPosition}
                  onChange={(event) => setSelectedPosition(event.target.value)}
                >
                  <option value="all">Todos los puestos</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </label>
              <label className="stage-filter">
                <span className="visually-hidden">Filtrar por etapa</span>
                <select
                  value={selectedStage}
                  onChange={(event) => updateSearchParam("stage", event.target.value)}
                >
                  <option value="all">Todas las etapas</option>
                  {stages.map((stage) => (
                    <option key={stage} value={stage}>{stageLabels[stage] ?? stage}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="status-tabs" role="group" aria-label="Filtrar por estado">
              {statusFilters.map((filter) => (
                <button
                  className={selectedStatus === filter.value ? "status-tab status-tab-active" : "status-tab"}
                  key={filter.value}
                  onClick={() => updateSearchParam("status", filter.value)}
                  type="button"
                  aria-pressed={selectedStatus === filter.value}
                >
                  {filter.label}
                  {filter.value === "all" && <span>{candidates.length}</span>}
                </button>
              ))}
            </div>

            {error ? (
              <div className="feedback-state feedback-error" role="alert">
                <strong>No se pudieron cargar las candidaturas</strong>
                <p>{error}</p>
                <Link href="/">Volver a intentar</Link>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="feedback-state">
                <strong>No hay candidaturas para mostrar</strong>
                <p>Prueba con otra búsqueda o cambia los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="table-scroll">
                <table className="candidate-table">
                  <thead>
                    <tr>
                      <th scope="col">Candidato/a</th>
                      <th scope="col">Puesto</th>
                      <th scope="col">Experiencia</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Etapa</th>
                      <th scope="col">Fecha de solicitud</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates.map((candidate, index) => (
                      <tr key={candidate.id}>
                        <td>
                          <div className="candidate-person">
                            <span className={`avatar avatar-${index % 5}`} aria-hidden="true">
                              {candidate.full_name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}
                            </span>
                            <span className="candidate-identity">
                              <strong>
                                <Link className="candidate-name-link" href={`/candidates/${candidate.id}`}>
                                  {candidate.full_name}
                                </Link>
                              </strong>
                              <a href={`mailto:${candidate.email}`}>{candidate.email}</a>
                            </span>
                          </div>
                        </td>
                        <td className="position-cell">{candidate.position}</td>
                        <td>{typeof candidate.experience_years === "number" ? `${candidate.experience_years} años` : "—"}</td>
                        <td>
                          <span className={`status-pill status-${candidate.status}`}>
                            <span />{statusLabels[candidate.status] ?? candidate.status}
                          </span>
                        </td>
                        <td>{stageLabels[candidate.stage] ?? candidate.stage}</td>
                        <td className="date-cell">{formatDate(candidate.applied_at ?? candidate.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="table-footer">
              Mostrando {filteredCandidates.length} de {candidates.length} candidaturas
            </div>
          </section>
          <footer className="privacy-note">
            Acceso restringido · Gestiona los datos de candidatos conforme a la política de privacidad de HealthCore.
          </footer>
        </div>
      </section>
    </main>
  );
}

export function CandidateBoardLoading() {
  return (
    <main className="workspace">
      <aside className="sidebar" aria-hidden="true">
        <div className="brand">
          <span className="brand-mark">H</span>
          <span className="brand-name">HealthCore</span>
        </div>
      </aside>
      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb">HealthCore <span>/</span> Talento</div>
        </header>
        <div className="page-content">
          <div className="loading-state" role="status" aria-live="polite" aria-busy="true">
            <span className="loading-spinner" aria-hidden="true" />
            <strong>Cargando candidaturas</strong>
            <p>Obteniendo los perfiles más recientes.</p>
          </div>
        </div>
      </section>
    </main>
  );
}