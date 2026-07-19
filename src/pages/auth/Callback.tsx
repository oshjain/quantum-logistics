import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Button } from "@/components/ui/button.tsx";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const updateCurrentUser = useMutation(api.users.updateCurrentUser);

  const navigateHome = useCallback(
    () => navigate("/", { replace: true }),
    [navigate],
  );

  useEffect(() => {
    if (isAuthenticated) {
      updateCurrentUser()
        .then(() => navigateHome())
        .catch(console.error);
    }
  }, [isAuthenticated, updateCurrentUser, navigateHome]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-svh gap-4">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-svh gap-6 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-destructive font-medium">Something went wrong</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Authentication failed. Please try again.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={navigateHome}>
          Return home
        </Button>
        <Button onClick={() => navigate(0)}>Try again</Button>
      </div>
    </div>
  );
}
