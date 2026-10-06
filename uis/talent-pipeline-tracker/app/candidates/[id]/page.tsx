import Link from "next/link";
import { notFound } from "next/navigation";
import {
  NoteComposer,
} from "@/components/candidates/note-composer";
import { NoteDeleteButton } from "@/components/candidates/note-delete-button";
import { StageControl, StatusControl } from "@/components/candidates/status-control";
import {
  API_BASE_URL,
  getCandidateById,
  getCandidateNotes,
} from "@/lib/candidate-api";
import type { CandidateDetail, CandidateNote } from "@/types/candidate";

const statusLabels: Record<string, string> = {
  received: "Recibida",
  in_progress: "En proceso",
  discarded: "Descartada",
};

function formatDate(value?: string) {
  if (!value) return "No disponible";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No disponible";

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let candidate: CandidateDetail | null = null;
  let errorMessage: string | undefined;

  try {
    candidate = await getCandidateById(id);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Error desconocido al cargar la candidatura.";
  }

  if (!candidate && !errorMessage) notFound();

  let notes: CandidateNote[] = [];
  let notesError: string | undefined;
  if (candidate) {
    try {
      notes = await getCandidateNotes(candidate.id);
    } catch (error) {
      notesError =
        error instanceof Error ? error.message : "Error desconocido al cargar las notas.";
    }
  }

  return (
    <main className="workspace">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="HealthCore, inicio">
          <span className="brand-mark">H</span>
          <span className="brand-name">HealthCore</span>
        </Link>
        <div className="sidebar-section-label">TALENTO</div>
        <Link className="sidebar-link sidebar-link-active" href="/">
          <span className="sidebar-link-indicator" />
          Candidaturas
        </Link>
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
          <div className="breadcrumb">HealthCore <span>/</span> Talento <span>/</span> Detalle</div>
          <Link className="refresh-link" href="/">Volver al listado</Link>
        </header>

        <div className="page-content">
          <Link className="back-link" href="/">← Todas las candidaturas</Link>
          {errorMessage ? (
            <div className="feedback-state feedback-error" role="alert">
              <strong>No se pudo cargar la candidatura</strong>
              <p>{errorMessage}</p>
              <Link href="/">Volver al listado</Link>
            </div>
          ) : candidate ? (
            <>
              <div className="detail-heading">
                <div>
                  <p className="eyebrow">PERFIL DE CANDIDATURA</p>
                  <h1>{candidate.full_name}</h1>
                  <p className="page-description">{candidate.position}</p>
                </div>
                <div className="detail-actions">
                  <Link className="secondary-action" href={`/candidates/${candidate.id}/edit`}>
                    Editar candidatura
                  </Link>
                  <span className={`status-pill status-${candidate.status}`}>
                    <span />{statusLabels[candidate.status] ?? candidate.status}
                  </span>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-main-column">
                  <section className="detail-card" aria-labelledby="candidate-info-title">
                    <div className="detail-card-heading">
                      <h2 id="candidate-info-title">Información del candidato</h2>
                      <span className="record-id">ID {candidate.id}</span>
                    </div>
                    <dl className="detail-facts">
                      <div>
                        <dt>Correo electrónico</dt>
                        <dd><a href={`mailto:${candidate.email}`}>{candidate.email}</a></dd>
                      </div>
                      <div>
                        <dt>Teléfono</dt>
                        <dd>{candidate.phone || "No disponible"}</dd>
                      </div>
                      <div>
                        <dt>Puesto</dt>
                        <dd>{candidate.position}</dd>
                      </div>
                      <div>
                        <dt>Experiencia</dt>
                        <dd>{typeof candidate.experience_years === "number" ? `${candidate.experience_years} años` : "No disponible"}</dd>
                      </div>
                      <div>
                        <dt>Fecha de solicitud</dt>
                        <dd>{formatDate(candidate.applied_at)}</dd>
                      </div>
                      <div>
                        <dt>Última actualización</dt>
                        <dd>{formatDate(candidate.updated_at)}</dd>
                      </div>
                    </dl>
                  </section>

                  <section className="detail-card" aria-labelledby="documents-title">
                    <div className="detail-card-heading">
                      <h2 id="documents-title">Enlaces del perfil</h2>
                    </div>
                    <div className="document-links">
                      {candidate.cv_url ? (
                        <a href={candidate.cv_url} target="_blank" rel="noreferrer">Abrir currículum</a>
                      ) : <span>Currículum no disponible</span>}
                      {candidate.linkedin_url ? (
                        <a href={candidate.linkedin_url} target="_blank" rel="noreferrer">Ver perfil de LinkedIn</a>
                      ) : <span>LinkedIn no disponible</span>}
                    </div>
                  </section>

                  <section className="detail-card" aria-labelledby="notes-title">
                    <div className="detail-card-heading">
                      <h2 id="notes-title">Notas del proceso</h2>
                      <span className="note-count">{notes.length}</span>
                    </div>
                    {notesError ? (
                      <p className="notes-message notes-error" role="alert">{notesError}</p>
                    ) : notes.length === 0 ? (
                      <p className="notes-message">Esta candidatura todavía no tiene notas.</p>
                    ) : (
                      <ul className="notes-list">
                        {notes.map((note) => (
                          <li key={note.id}>
                            <div className="note-entry-header">
                              <time dateTime={note.created_at}>{formatDate(note.created_at)}</time>
                              <NoteDeleteButton
                                candidateId={candidate.id}
                                noteId={note.id}
                                apiBaseUrl={API_BASE_URL}
                              />
                            </div>
                            <p>{note.content}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <NoteComposer candidateId={candidate.id} apiBaseUrl={API_BASE_URL} />
                  </section>
                </div>

                <aside className="detail-side-column">
                  <section className="detail-card status-card" aria-labelledby="process-title">
                    <div className="detail-card-heading">
                      <h2 id="process-title">Proceso de selección</h2>
                    </div>
                    <dl className="process-facts">
                      <div>
                        <dt>Estado</dt>
                        <dd><StatusControl
                          candidateId={candidate.id}
                          apiBaseUrl={API_BASE_URL}
                          currentStatus={candidate.status}
                        /></dd>
                      </div>
                      <div>
                        <dt>Etapa actual</dt>
                        <dd><StageControl
                          candidateId={candidate.id}
                          apiBaseUrl={API_BASE_URL}
                          currentStage={candidate.stage}
                        /></dd>
                      </div>
                      <div>
                        <dt>Notas registradas</dt>
                        <dd>{typeof candidate.notes_count === "number" ? candidate.notes_count : "No disponible"}</dd>
                      </div>
                    </dl>
                  </section>
                  <p className="detail-privacy">
                    Información personal de candidatos. Consulta y utiliza estos datos según las políticas de privacidad de HealthCore.
                  </p>
                </aside>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}