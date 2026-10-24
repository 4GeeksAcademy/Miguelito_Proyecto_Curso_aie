"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addCandidateNote } from "@/lib/candidate-api";

type NoteComposerProps = {
  candidateId: string;
  apiBaseUrl: string;
};

export function NoteComposer({ candidateId, apiBaseUrl }: NoteComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const noteContent = content.trim();
    if (!noteContent) return;

    setIsSubmitting(true);
    setMessage("");
    setHasError(false);

    try {
      await addCandidateNote(apiBaseUrl, candidateId, noteContent);

      setContent("");
      setMessage("Nota añadida.");
      router.refresh();
    } catch (error) {
      setHasError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo añadir la nota. Inténtalo de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="note-form" onSubmit={submitNote} aria-busy={isSubmitting}>
      <label htmlFor="new-note">Añadir una nota</label>
      <textarea
        id="new-note"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Escribe una nota sobre el proceso..."
        rows={3}
        required
        disabled={isSubmitting}
      />
      <div className="note-form-footer">
        <p
          className={hasError ? "note-form-message note-form-error" : "note-form-message"}
          role={hasError ? "alert" : "status"}
          aria-live="polite"
        >
          {isSubmitting ? "Guardando nota..." : message}
        </p>
        <button
          className="note-submit"
          type="submit"
          disabled={isSubmitting || content.trim().length === 0}
        >
          {isSubmitting ? "Guardando..." : "Añadir nota"}
        </button>
      </div>
    </form>
  );
}