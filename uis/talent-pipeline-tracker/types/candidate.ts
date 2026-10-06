export type Candidate = {
  id: string;
  full_name: string;
  email: string;
  position: string;
  status: string;
  stage: string;
  phone?: string | null;
  linkedin_url?: string | null;
  cv_url?: string | null;
  applied_at?: string;
  updated_at?: string;
  experience_years?: number;
  notes_count?: number;
};

export type CandidateDetail = Candidate & {
  phone: string;
  linkedin_url: string | null;
  cv_url: string | null;
};

export type EditableCandidate = Pick<
  CandidateDetail,
  | "id"
  | "full_name"
  | "email"
  | "phone"
  | "position"
  | "linkedin_url"
  | "cv_url"
  | "experience_years"
>;

export type CandidatePayload = Omit<EditableCandidate, "id">;

export type CandidateNote = {
  id: string;
  record_id: string;
  content: string;
  created_at: string;
};

export type RecordsResponse = {
  data: Candidate[];
  total: number;
  page: number;
  limit: number;
};

export type NotesResponse = {
  data: CandidateNote[];
  meta: { total: number };
};