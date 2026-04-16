import dotenv from "dotenv";

dotenv.config();

function clearBrokenLocalProxyEnv() {
  const proxyKeys = [
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "ALL_PROXY",
    "http_proxy",
    "https_proxy",
    "all_proxy",
    "GIT_HTTP_PROXY",
    "GIT_HTTPS_PROXY"
  ];
  const badProxyPattern = /(127\.0\.0\.1|localhost):9\b/i;

  for (const key of proxyKeys) {
    if (badProxyPattern.test(process.env[key] || "")) {
      process.env[key] = "";
    }
  }
}

function asBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

clearBrokenLocalProxyEnv();

export const config = {
  host: process.env.HOST || "0.0.0.0",
  port: Number(process.env.PORT || 3000),
  sarvam: {
    apiKey: process.env.SARVAM_API_KEY || "",
    baseUrl: process.env.SARVAM_API_URL || "https://api.sarvam.ai",
    model: process.env.SARVAM_MODEL || "saaras:v3",
    languageCode: process.env.SARVAM_LANGUAGE_CODE || "unknown",
    mode: process.env.SARVAM_MODE || "codemix",
    withTimestamps: asBoolean(process.env.SARVAM_WITH_TIMESTAMPS, false)
  },
  storage: {
    engine:
      process.env.STORAGE_ENGINE ||
      (process.env.MONGODB_URI ? "mongo" : "file"),
    filePath: process.env.COMPLAINT_DATA_FILE || "data/complaints.json",
    mongodbUri: process.env.MONGODB_URI || ""
  }
};
