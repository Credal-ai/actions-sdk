const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";
// ~30k chars ≈ ~8k tokens, well within gpt-4o-mini's 128k context window
// while keeping request payloads and latency reasonable.
export const MAX_INPUT_CHARS = 30_000;

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export async function summarizeContent(content: string, fileName: string, maxLength: number): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return content.slice(0, maxLength);
  }

  const truncatedContent = content.slice(0, MAX_INPUT_CHARS);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: `Summarize the following document in at most ${maxLength} characters. Preserve the most important information and key details. Return only the summary text with no preamble.`,
          },
          {
            role: "user",
            content: `Document "${fileName}":\n\n${truncatedContent}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
      return content.slice(0, maxLength);
    }

    const result: OpenAIResponse = await response.json();
    const summary = result.choices?.[0]?.message?.content;

    return summary ?? content.slice(0, maxLength);
  } catch (error) {
    console.error("Failed to summarize content:", error instanceof Error ? error.message : error);
    return content.slice(0, maxLength);
  }
}
