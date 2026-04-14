/**
 * Telegram Media Handling — download files, transcribe audio, generate images, send photos.
 *
 * Requires: OPENAI_API_KEY for Whisper (transcription) and DALL-E 3 (image generation).
 * Falls back gracefully if not configured.
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();

/**
 * Download a file from Telegram by file_id.
 * Returns the file as a Buffer + the file path on Telegram servers.
 */
export async function downloadTelegramFile(fileId: string): Promise<{ buffer: Buffer; filePath: string } | null> {
  if (!TELEGRAM_BOT_TOKEN) return null;

  try {
    // Step 1: Get file path from Telegram
    const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      console.error("[Telegram Media] getFile failed:", fileData);
      return null;
    }

    const filePath = fileData.result.file_path as string;

    // Step 2: Download the file
    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    const downloadRes = await fetch(downloadUrl);

    if (!downloadRes.ok) {
      console.error("[Telegram Media] Download failed:", downloadRes.status);
      return null;
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), filePath };
  } catch (err) {
    console.error("[Telegram Media] Error downloading file:", err);
    return null;
  }
}

/**
 * Transcribe audio using OpenAI Whisper API.
 * Accepts OGG, MP3, WAV, M4A, WEBM formats.
 */
export async function transcribeAudio(audioBuffer: Buffer, fileName: string = "audio.ogg"): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    console.error("[Telegram Media] OPENAI_API_KEY not configured for transcription");
    return null;
  }

  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" });
    formData.append("file", blob, fileName);
    formData.append("model", "whisper-1");
    formData.append("language", "es");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Telegram Media] Whisper API error:", res.status, errText);
      return null;
    }

    const data = await res.json();
    return data.text || null;
  } catch (err) {
    console.error("[Telegram Media] Transcription error:", err);
    return null;
  }
}

/**
 * Generate an image using OpenAI DALL-E 3.
 * Returns the image URL (valid for ~1 hour).
 */
export async function generateImage(
  prompt: string,
  options: { size?: "1024x1024" | "1792x1024" | "1024x1792"; quality?: "standard" | "hd" } = {}
): Promise<string | null> {
  if (!OPENAI_API_KEY) {
    console.error("[Telegram Media] OPENAI_API_KEY not configured for image generation");
    return null;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: options.size || "1024x1024",
        quality: options.quality || "standard",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Telegram Media] DALL-E API error:", res.status, errText);
      return null;
    }

    const data = await res.json();
    return data.data?.[0]?.url || null;
  } catch (err) {
    console.error("[Telegram Media] Image generation error:", err);
    return null;
  }
}

/**
 * Send a photo to Pablo via Telegram.
 * Accepts a URL or a Buffer.
 */
export async function sendTelegramPhoto(
  photo: string | Buffer,
  caption?: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;

  try {
    if (typeof photo === "string") {
      // Send by URL
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          photo,
          caption: caption?.slice(0, 1024),
          parse_mode: "HTML",
        }),
      });
      return res.ok;
    } else {
      // Send by upload
      const formData = new FormData();
      formData.append("chat_id", TELEGRAM_CHAT_ID);
      const blob = new Blob([new Uint8Array(photo)], { type: "image/png" });
      formData.append("photo", blob, "image.png");
      if (caption) formData.append("caption", caption.slice(0, 1024));
      formData.append("parse_mode", "HTML");

      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        body: formData,
      });
      return res.ok;
    }
  } catch (err) {
    console.error("[Telegram Media] Error sending photo:", err);
    return false;
  }
}

/**
 * Send a video to Pablo via Telegram.
 * Accepts a URL or a Buffer.
 */
export async function sendTelegramVideo(
  video: string | Buffer,
  caption?: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;

  try {
    if (typeof video === "string") {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          video,
          caption: caption?.slice(0, 1024),
          parse_mode: "HTML",
        }),
      });
      return res.ok;
    } else {
      const formData = new FormData();
      formData.append("chat_id", TELEGRAM_CHAT_ID);
      const blob = new Blob([new Uint8Array(video)], { type: "video/mp4" });
      formData.append("video", blob, "video.mp4");
      if (caption) formData.append("caption", caption.slice(0, 1024));
      formData.append("parse_mode", "HTML");
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
        method: "POST",
        body: formData,
      });
      return res.ok;
    }
  } catch (err) {
    console.error("[Telegram Media] Error sending video:", err);
    return false;
  }
}

/**
 * Send a document to Pablo via Telegram.
 */
export async function sendTelegramDocument(
  document: Buffer,
  fileName: string,
  caption?: string
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;

  try {
    const formData = new FormData();
    formData.append("chat_id", TELEGRAM_CHAT_ID);
    const blob = new Blob([new Uint8Array(document)]);
    formData.append("document", blob, fileName);
    if (caption) formData.append("caption", caption.slice(0, 1024));
    formData.append("parse_mode", "HTML");

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
      method: "POST",
      body: formData,
    });
    return res.ok;
  } catch (err) {
    console.error("[Telegram Media] Error sending document:", err);
    return false;
  }
}
