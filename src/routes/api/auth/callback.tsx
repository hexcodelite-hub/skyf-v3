import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

// Zmeň túto cestu na presnú zložku, kde súbor leží
export const Route = createFileRoute("/api/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const search = Route.useSearch<{ userId: string }>();

  useEffect(() => {
    if (search.userId) {
      localStorage.setItem("kick_user_id", search.userId);
      navigate({ to: "/profile" });
    }
  }, [search.userId, navigate]);

  return <div>Prihlasujem...</div>;
}