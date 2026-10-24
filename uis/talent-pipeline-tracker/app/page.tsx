import { Suspense } from "react";
import {
  CandidateBoard,
  CandidateBoardLoading,
} from "@/components/candidates/candidate-board";
import { getAllCandidates } from "@/lib/candidate-api";
import type { Candidate } from "@/types/candidate";

export default async function Home() {
  let candidates: Candidate[] = [];
  let errorMessage: string | undefined;

  try {
    candidates = await getAllCandidates();
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : "Error desconocido al cargar los datos.";
  }

  return (
    <Suspense fallback={<CandidateBoardLoading />}>
      <CandidateBoard candidates={candidates} error={errorMessage} />
    </Suspense>
  );
}
