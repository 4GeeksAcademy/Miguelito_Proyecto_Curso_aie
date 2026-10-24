import { notFound } from "next/navigation";
import { CandidateFormPage } from "@/components/candidates/candidate-form";
import { API_BASE_URL, getCandidateById } from "@/lib/candidate-api";
import type { EditableCandidate } from "@/types/candidate";

export default async function EditCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCandidateById(
    id,
    (status) => `No se pudo cargar la candidatura (HTTP ${status}).`,
  );
  if (!candidate) notFound();
  return (
    <CandidateFormPage
      mode="edit"
      apiBaseUrl={API_BASE_URL}
      candidate={candidate as EditableCandidate}
    />
  );
}