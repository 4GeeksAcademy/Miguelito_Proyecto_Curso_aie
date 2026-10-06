import type {
  Candidate,
  CandidateDetail,
  CandidateNote,
  CandidatePayload,
  NotesResponse,
  RecordsResponse,
} from "@/types/candidate";

export const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://playground.4geeks.com/tracker/api/v1";

function endpoint(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function throwForApiError(response: Response, message?: (status: number) => string) {
  if (!response.ok) {
    throw new Error(message ? message(response.status) : `La API respondió con el estado ${response.status}.`);
  }
}

export async function getAllCandidates(): Promise<Candidate[]> {
  const candidates: Candidate[] = [];
  const pageSize = 100;
  let total = Number.POSITIVE_INFINITY;
  let page = 1;

  while (candidates.length < total) {
    const response = await fetch(
      endpoint(API_BASE_URL, `records?page=${page}&limit=${pageSize}`),
      { cache: "no-store" },
    );
    throwForApiError(response);

    const result = (await response.json()) as RecordsResponse;
    if (!Array.isArray(result.data)) {
      throw new Error("La respuesta de /records no contiene una lista válida.");
    }

    total = result.total;
    candidates.push(...result.data);
    page += 1;

    if (result.data.length === 0) break;
  }

  return candidates;
}

export async function getCandidateById(
  id: string,
  errorMessage?: (status: number) => string,
): Promise<CandidateDetail | null> {
  const response = await fetch(
    endpoint(API_BASE_URL, `records/${encodeURIComponent(id)}`),
    { cache: "no-store" },
  );

  if (response.status === 404) return null;
  throwForApiError(response, errorMessage);
  return (await response.json()) as CandidateDetail;
}

export async function getCandidateNotes(id: string): Promise<CandidateNote[]> {
  const response = await fetch(
    endpoint(API_BASE_URL, `records/${encodeURIComponent(id)}/notes`),
    { cache: "no-store" },
  );
  throwForApiError(response, (status) => `No se pudieron cargar las notas (HTTP ${status}).`);

  const result = (await response.json()) as NotesResponse;
  if (!Array.isArray(result.data)) {
    throw new Error("La respuesta de notas no contiene una lista válida.");
  }

  return result.data;
}

export async function saveCandidate(
  baseUrl: string,
  mode: "create" | "edit",
  id: string | undefined,
  payload: CandidatePayload,
): Promise<{ id?: string }> {
  const path = mode === "create" ? "records" : `records/${encodeURIComponent(id ?? "")}`;
  const response = await fetch(endpoint(baseUrl, path), {
    method: mode === "create" ? "POST" : "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  throwForApiError(
    response,
    (status) => `La API respondió con el estado ${status}. Revisa los datos e inténtalo de nuevo.`,
  );

  if (mode === "edit") return {};
  let result: unknown = null;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (typeof result === "object" && result !== null && "id" in result && typeof result.id === "string") {
    return { id: result.id };
  }

  return {};
}

export async function patchCandidateField(
  baseUrl: string,
  candidateId: string,
  field: "status" | "stage",
  value: string,
): Promise<void> {
  const resource = field === "status" ? "record" : "records";
  const response = await fetch(
    endpoint(baseUrl, `${resource}/${encodeURIComponent(candidateId)}`),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(field === "status" ? { status: value } : { stage: value }),
    },
  );
  throwForApiError(response);
}

export async function addCandidateNote(
  baseUrl: string,
  candidateId: string,
  content: string,
): Promise<void> {
  const response = await fetch(
    endpoint(baseUrl, `records/${encodeURIComponent(candidateId)}/notes`),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );
  throwForApiError(response);
}

export async function deleteCandidateNote(
  baseUrl: string,
  candidateId: string,
  noteId: string,
): Promise<void> {
  const response = await fetch(
    endpoint(baseUrl, `records/${encodeURIComponent(candidateId)}/notes/${encodeURIComponent(noteId)}`),
    { method: "DELETE" },
  );
  throwForApiError(response);
}