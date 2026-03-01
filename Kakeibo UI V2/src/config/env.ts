export const ENV = {
  MODE: import.meta.env.MODE,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,

  APP_NAME: import.meta.env.VITE_APP_NAME as string,
  // Support both key styles used in .env maps
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_KEY) as string,
  ENABLE_LOGS: import.meta.env.VITE_ENABLE_LOGS === "true",
};
