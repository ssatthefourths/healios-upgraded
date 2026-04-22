import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_CF_WORKER_URL || "https://healios-api.ss-f01.workers.dev";

type ConfigMap = Record<string, string>;

/**
 * Public footer / site-wide config (social URLs, trust URLs, etc.).
 *
 * Aggressive client cache: 1 hour staleTime matches the worker's
 * s-maxage=3600 — one fetch per session, not per page. The footer
 * re-renders across route changes without refetching. Admin save on the
 * other side purges the worker's edge cache so new values go live fast.
 */
export const useSiteConfig = () => {
  const query = useQuery<ConfigMap>({
    queryKey: ["site-config"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/public/site-config`);
      if (!res.ok) return {};
      const data = (await res.json()) as { config?: ConfigMap };
      return data.config ?? {};
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    config: query.data ?? {},
    loading: query.isLoading,
    error: query.error,
  };
};
