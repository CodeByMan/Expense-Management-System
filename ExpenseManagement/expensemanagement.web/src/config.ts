const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "")
  ?? "https://localhost:7210/api";

const apiOrigin = apiBaseUrl.replace(/\/api$/, "");

export const appConfig = {
  apiBaseUrl,
  signalRHubUrl: (import.meta.env.VITE_SIGNALR_HUB_URL as string | undefined)?.replace(/\/$/, "")
    ?? `${apiOrigin}/notificationHub`,
};
