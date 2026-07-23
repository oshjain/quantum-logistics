import { RatingModal } from "@/components/ratings/RatingModal.tsx";

export function GlobalRatingButton() {
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <RatingModal />
    </div>
  );
}
