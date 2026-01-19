import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export type AppSettings = {
  name: string;
  address?: string;
  phone?: string;
  logoPath?: string;
};

export function useAppSettings() {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const res = await apiRequest<{ settings: AppSettings }>("/api/settings");
      return res.settings;
    },
  });
}
