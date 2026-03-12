import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

export function getModel(provider: string) {
  switch (provider) {
    case "openai":
      return createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })("gpt-4o");
    case "claude":
    default:
      return createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })("claude-sonnet-4-20250514");
  }
}
