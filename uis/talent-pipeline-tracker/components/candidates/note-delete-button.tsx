"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCandidateNote } from "@/lib/candidate-api";

type NoteDeleteButtonProps = {
  candidateId: string;
  noteId: string;
  apiBaseUrl: string;
};

export function NoteDeleteButton({
  candidateId,
  noteId,
  apiBaseUrl,
}: NoteDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function deleteNote() {
    if (!window.confirm("¿Eliminar esta nota? Esta acción no se puede deshacer.")) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      await deleteCandidateNote(apiBaseUrl, candidateId, noteId);

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la nota. Inténtalo de nuevo.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="note-delete-action" aria-busy={isDeleting}>
      <button
        className="note-delete-button"
        type="button"
        onClick={() => void deleteNote()}
        disabled={isDeleting}
        aria-label="Eliminar esta nota"
      >
        {isDeleting ? "Eliminando..." : "Eliminar"}
      </button>
      {errorMessage && <p className="note-delete-error" role="alert">{errorMessage}</p>}
    </div>
  );
}