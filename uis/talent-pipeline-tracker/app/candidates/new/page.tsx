import { CandidateFormPage } from "@/components/candidates/candidate-form";
import { API_BASE_URL } from "@/lib/candidate-api";

export default function NewCandidatePage() {
  return <CandidateFormPage mode="create" apiBaseUrl={API_BASE_URL} />;
}