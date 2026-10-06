"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { patchCandidateField } from "@/lib/candidate-api";

type StatusControlProps = {
  candidateId: string;
  apiBaseUrl: string;
  currentStatus: string;
};

type StageControlProps = {
  candidateId: string;
  apiBaseUrl: string;
  currentStage: string;
};

const statusOptions = [
  { value: "received", label: "Recibida" },
  { value: "in_progress", label: "En proceso" },
  { value: "discarded", label: "Descartada" },
];

const stageOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "review", label: "En revisión" },
  { value: "personal_interview", label: "Entrevista personal" },
  { value: "technical_interview", label: "Entrevista técnica" },
];

export function StatusControl({
  candidateId,
  apiBaseUrl,
  currentStatus,
}: StatusControlProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  async function updateStatus(nextStatus: string) {
    setIsSaving(true);
    setMessage("");
    setHasError(false);

    try {
      await patchCandidateField(apiBaseUrl, candidateId, "status", nextStatus);
      setStatus(nextStatus);
      setMessage("Estado actualizado.");
      router.refresh();
    } catch (error) {
      setHasError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado. Inténtalo de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="status-update-control" aria-busy={isSaving}>
      <label htmlFor="candidate-status">Estado de la candidatura</label>
      <select
        id="candidate-status"
        className="status-update-select"
        value={status}
        onChange={(event) => void updateStatus(event.target.value)}
        disabled={isSaving}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <p
        className={hasError ? "status-update-message status-update-error" : "status-update-message"}
        role={hasError ? "alert" : "status"}
        aria-live="polite"
      >
        {isSaving ? "Guardando estado..." : message}
      </p>
    </div>
  );
}

export function StageControl({
  candidateId,
  apiBaseUrl,
  currentStage,
}: StageControlProps) {
  const router = useRouter();
  const [stage, setStage] = useState(currentStage);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  async function updateStage(nextStage: string) {
    setIsSaving(true);
    setMessage("");
    setHasError(false);

    try {
      await patchCandidateField(apiBaseUrl, candidateId, "stage", nextStage);
      setStage(nextStage);
      setMessage("Etapa actualizada.");
      router.refresh();
    } catch (error) {
      setHasError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la etapa. Inténtalo de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="status-update-control" aria-busy={isSaving}>
      <label htmlFor="candidate-stage">Etapa de la candidatura</label>
      <select
        id="candidate-stage"
        className="status-update-select"
        value={stage}
        onChange={(event) => void updateStage(event.target.value)}
        disabled={isSaving}
      >
        {stageOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <p
        className={hasError ? "status-update-message status-update-error" : "status-update-message"}
        role={hasError ? "alert" : "status"}
        aria-live="polite"
      >
        {isSaving ? "Guardando etapa..." : message}
      </p>
    </div>
  );
}