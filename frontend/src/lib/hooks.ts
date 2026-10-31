import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./api";
import { DEFAULT_SETTINGS, mergeServices } from "./content";
import type { ServiceOverride, SiteSettings, UserPublic } from "./types";

// Static defaults render instantly (and on the backend-less CDN preview); live admin-edited values replace them.
export function useSettings(): SiteSettings {
  const { data, isError } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiGet<SiteSettings>("/settings"),
    staleTime: 60_000,
  });
  return data && !isError ? { ...DEFAULT_SETTINGS, ...data } : DEFAULT_SETTINGS;
}

export function useServices() {
  const { data } = useQuery({
    queryKey: ["service-overrides"],
    queryFn: () => apiGet<ServiceOverride[]>("/services/overrides"),
    staleTime: 60_000,
  });
  return mergeServices(data);
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<UserPublic | null>("/auth/me"),
    retry: false,
    staleTime: 30_000,
  });
}

export function errMsg(e: unknown): string {
  const b = (e as { body?: { detail?: unknown } })?.body;
  const d = b?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d) && d[0]?.msg) return `${(d[0].loc ?? []).slice(-1)[0] ?? "field"}: ${d[0].msg}`;
  return "Something went wrong. Please try again.";
}

// multipart upload — the JSON helpers in api.ts can't send FormData
export async function uploadFile<T>(path: string, file: File): Promise<T> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api${path}`, { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw Object.assign(new Error("upload failed"), { status: res.status, body });
  }
  return (await res.json()) as T;
}
