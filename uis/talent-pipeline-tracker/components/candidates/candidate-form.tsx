"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { saveCandidate } from "@/lib/candidate-api";
import type { CandidatePayload, EditableCandidate } from "@/types/candidate";

type CandidateFormPageProps = {
  mode: "create" | "edit";
  apiBaseUrl: string;
  candidate?: EditableCandidate;
};

export function CandidateFormPage({
  mode,
  apiBaseUrl,
  candidate,
}: CandidateFormPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdCandidateId, setCreatedCandidateId] = useState<string | null>(null);
  const isEditing = mode === "edit";
  const cancelHref = isEditing && candidate ? `/candidates/${candidate.id}` : "/";

  async function submitCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const fullName = String(formData.get("full_name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const position = String(formData.get("position") ?? "").trim();
    const experienceInput = String(formData.get("experience_years") ?? "").trim();
    const linkedinUrl = String(formData.get("linkedin_url") ?? "").trim();
    const cvUrl = String(formData.get("cv_url") ?? "").trim();

    setErrorMessage("");
    setSuccessMessage("");
    setCreatedCandidateId(null);

    const missingFields = [
      [fullName, "nombre completo"],
      [email, "correo electrónico"],
      [phone, "teléfono"],
      [position, "puesto"],
      [experienceInput, "años de experiencia"],
    ].filter(([value]) => !value).map(([, label]) => label);

    if (missingFields.length > 0) {
      setErrorMessage(`Completa los campos obligatorios: ${missingFields.join(", ")}.`);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Introduce un correo electrónico válido.");
      return;
    }

    const experienceYears = Number(experienceInput);
    if (!Number.isFinite(experienceYears) || !Number.isInteger(experienceYears) || experienceYears < 0) {
      setErrorMessage("Los años de experiencia deben ser un número entero igual o mayor que cero.");
      return;
    }

    const invalidUrl = [linkedinUrl, cvUrl].some((value) => {
      if (!value) return false;
      try {
        const url = new URL(value);
        return url.protocol !== "http:" && url.protocol !== "https:";
      } catch {
        return true;
      }
    });

    if (invalidUrl) {
      setErrorMessage("Los enlaces de LinkedIn y currículum deben ser URLs válidas que empiecen con http:// o https://.");
      return;
    }

    const payload: CandidatePayload = {
      full_name: fullName,
      email,
      phone,
      position,
      linkedin_url: linkedinUrl || null,
      cv_url: cvUrl || null,
      experience_years: experienceYears,
    };

    setIsSubmitting(true);

    try {
      const result = await saveCandidate(apiBaseUrl, mode, candidate?.id, payload);
      setSuccessMessage(isEditing ? "La candidatura se actualizó correctamente." : "La candidatura se creó correctamente.");
      if (!isEditing) {
        setCreatedCandidateId(result.id ?? null);
        formElement.reset();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la candidatura. Inténtalo de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
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
          <div className="breadcrumb">HealthCore <span>/</span> Talento <span>/</span> {isEditing ? "Editar candidatura" : "Nueva candidatura"}</div>
          <Link className="refresh-link" href={cancelHref}>Cancelar</Link>
        </header>

        <div className="page-content candidate-form-page">
          <Link className="back-link" href={cancelHref}>
            {isEditing ? "← Volver al detalle" : "← Todas las candidaturas"}
          </Link>
          <div className="page-heading">
            <div>
              <p className="eyebrow">PEOPLE &amp; WORKFORCE</p>
              <h1>{isEditing ? "Editar candidatura" : "Nueva candidatura"}</h1>
              <p className="page-description">
                {isEditing ? "Actualiza la información del perfil." : "Registra un perfil para iniciar el proceso de selección."}
              </p>
            </div>
          </div>

          <form className="candidate-form-card" onSubmit={submitCandidate} aria-busy={isSubmitting} noValidate>
            <fieldset className="candidate-form-fields" disabled={isSubmitting}>
              <div className="candidate-form-grid">
                <label className="candidate-form-field">
                  <span>Nombre completo <b>*</b></span>
                  <input name="full_name" type="text" autoComplete="name" defaultValue={candidate?.full_name ?? ""} required />
                </label>
                <label className="candidate-form-field">
                  <span>Correo electrónico <b>*</b></span>
                  <input name="email" type="email" autoComplete="email" defaultValue={candidate?.email ?? ""} required />
                </label>
                <label className="candidate-form-field">
                  <span>Teléfono <b>*</b></span>
                  <input name="phone" type="tel" autoComplete="tel" defaultValue={candidate?.phone ?? ""} required />
                </label>
                <label className="candidate-form-field">
                  <span>Puesto <b>*</b></span>
                  <input name="position" type="text" defaultValue={candidate?.position ?? ""} required />
                </label>
                <label className="candidate-form-field">
                  <span>Años de experiencia <b>*</b></span>
                  <input name="experience_years" type="number" min="0" step="1" defaultValue={candidate?.experience_years ?? ""} required />
                </label>
                <label className="candidate-form-field">
                  <span>LinkedIn</span>
                  <input name="linkedin_url" type="url" placeholder="https://linkedin.com/in/..." defaultValue={candidate?.linkedin_url ?? ""} />
                </label>
                <label className="candidate-form-field candidate-form-field-wide">
                  <span>Enlace al currículum</span>
                  <input name="cv_url" type="url" placeholder="https://..." defaultValue={candidate?.cv_url ?? ""} />
                </label>
              </div>
            </fieldset>

            {errorMessage && <p className="candidate-form-error" role="alert" aria-live="assertive">{errorMessage}</p>}
            {successMessage && (
              <div className="candidate-form-success" role="status" aria-live="polite">
                <span>{successMessage}</span>
                {createdCandidateId && <Link href={`/candidates/${createdCandidateId}`}>Ver candidatura</Link>}
              </div>
            )}
            <div className="candidate-form-footer">
              <Link className="secondary-action" href={cancelHref}>Cancelar</Link>
              <button className="primary-action" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear candidatura"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}