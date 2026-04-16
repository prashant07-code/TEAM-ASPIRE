import { Blob } from "node:buffer";

function mimeToExtension(mimeType) {
  const lookup = {
    "audio/webm": "webm",
    "audio/webm;codecs=opus": "webm",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a"
  };

  return lookup[mimeType] || "webm";
}

export class SarvamSpeechService {
  constructor(options) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.model = options.model;
    this.languageCode = options.languageCode;
    this.mode = options.mode;
    this.withTimestamps = options.withTimestamps;
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  async transcribeAudio({
    audioBuffer,
    mimeType = "audio/webm",
    languageCode,
    mode,
    withTimestamps
  }) {
    if (!this.isConfigured()) {
      throw new Error(
        "Sarvam API key is missing. Add SARVAM_API_KEY in your .env file to enable speech transcription."
      );
    }

    const payload = new FormData();
    const selectedLanguage = languageCode || this.languageCode;
    const selectedMode = mode || this.mode;
    const wantsTimestamps =
      typeof withTimestamps === "boolean" ? withTimestamps : this.withTimestamps;

    payload.append(
      "file",
      new Blob([audioBuffer], { type: mimeType }),
      `complaint-audio.${mimeToExtension(mimeType)}`
    );
    payload.append("model", this.model);
    payload.append("language_code", selectedLanguage);
    payload.append("mode", selectedMode);
    payload.append("with_timestamps", String(Boolean(wantsTimestamps)));

    const response = await fetch(`${this.baseUrl}/speech-to-text`, {
      method: "POST",
      headers: {
        "api-subscription-key": this.apiKey
      },
      body: payload
    });

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");
    const body = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message =
        body?.error?.message ||
        body?.message ||
        (typeof body === "string" ? body : "Sarvam transcription failed.");

      throw new Error(message);
    }

    return {
      requestId: body.request_id || null,
      transcript: body.transcript || "",
      languageCode: body.language_code || selectedLanguage || null,
      languageProbability: body.language_probability ?? null,
      timestamps: body.timestamps || null,
      mode: selectedMode,
      model: this.model
    };
  }
}
