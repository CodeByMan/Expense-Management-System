import { appConfig } from "@/config";

export const DEFAULT_AVATAR = "/images/default-avatar-man.svg";

export function resolveAvatarUrl(profileImageUrl?: string | null) {
  if (!profileImageUrl) return DEFAULT_AVATAR;
  if (/^https?:\/\//i.test(profileImageUrl) || profileImageUrl.startsWith("data:")) return profileImageUrl;
  const apiOrigin = appConfig.apiBaseUrl.replace(/\/api\/?$/, "");
  return `${apiOrigin}${profileImageUrl.startsWith("/") ? "" : "/"}${profileImageUrl}`;
}
