import { useAuthContext } from "@/lib/auth/index.ts";
import { IdeaModal } from "./IdeaModal.tsx";

export function FloatingIdeaButton() {
  const { email } = useAuthContext();
  if (!email) return null;

  return <IdeaModal />;
}
