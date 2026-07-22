import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader } from "@/components/kit";
import { useAuthState } from "@/modules/auth/presentation/model/useAuthState";

export function AuthLayout() {
  const { isLoading, isAuthenticated } = useAuthState();
  const navigate = useNavigate({ from: "/auth" });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/app/dashboard" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,oklch(0.656_0.118_181.7/0.14),transparent_55%),radial-gradient(ellipse_55%_40%_at_100%_100%,oklch(0.971_0.003_285.7),transparent_60%),radial-gradient(ellipse_45%_35%_at_0%_90%,oklch(0.95_0.02_181.7/0.55),transparent_55%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,oklch(0.656_0.118_181.7/0.18),transparent_55%),radial-gradient(ellipse_55%_40%_at_100%_100%,oklch(0.3_0_263.3),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] mask-[radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)] bg-[linear-gradient(to_right,oklch(0.93_0.003_285.7)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.93_0.003_285.7)_1px,transparent_1px)] bg-size-[48px_48px] dark:opacity-[0.12]"
      />

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-12 md:px-8 md:py-16">
        <Outlet />
      </main>
    </div>
  );
}
