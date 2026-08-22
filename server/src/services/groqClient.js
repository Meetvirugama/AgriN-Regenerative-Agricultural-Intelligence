/**
 * groqClient.js
 *
 * A Node.js Groq API client that mirrors the Python ai-service generate_text().
 * Used as a direct fallback when the Python AI service is unreachable.
 *
 * - Uses round-robin rotation of GROQ_API_KEYS env var (comma-separated)
 * - Enforces JSON output via Groq's response_format
 * - Retries automatically on 429 rate limit errors
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "qwen/qwen3-32b";
const TIMEOUT_MS = 30_000;

// Parse keys once at module load
const rawKeys = (process.env.GROQ_API_KEYS ?? "").split(",").map((k) => k.trim()).filter(Boolean);

if (!rawKeys.length) {
  console.warn("[GroqClient] WARNING: GROQ_API_KEYS not set. Direct Groq calls will fail.");
}

let keyIndex = 0;

function nextKey() {
  if (!rawKeys.length) throw new Error("GROQ_API_KEYS is not configured.");
  const key = rawKeys[keyIndex % rawKeys.length];
  keyIndex++;
  return key;
}

/**
 * Call Groq and return a parsed JSON object.
 *
 * @param {string} prompt - The full prompt to send
 * @param {object} [options]
 * @param {number} [options.temperature=0.4]
 * @param {number} [options.maxTokens=4096]
 * @returns {Promise<object>} Parsed JSON response from Groq
 */
export async function generateJson(prompt, { temperature = 0.4, maxTokens = 4096 } = {}) {
  const maxAttempts = Math.max(rawKeys.length, 1);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const key = nextKey();

    const payload = {
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.status === 429) {
        console.warn(`[GroqClient] Rate limited (429) on attempt ${attempt + 1}/${maxAttempts}. Rotating key...`);
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Groq API error (${res.status}): ${text.slice(0, 300)}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content) throw new Error("Groq returned an empty response.");

      return JSON.parse(content);
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError") throw new Error("Groq request timed out after 30s.");
      if (attempt < maxAttempts - 1 && err.message?.includes("429")) continue;
      throw err;
    }
  }

  throw new Error("All Groq API keys are currently rate-limited. Please try again in a moment.");
}
