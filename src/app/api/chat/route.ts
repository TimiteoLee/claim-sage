import { convertToModelMessages, streamText, UIMessage } from "ai";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, conversations, messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getModel } from "@/lib/ai/providers";
import { getSystemPrompt } from "@/lib/ai/system-prompts";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages: chatMessages, conversationId }: { messages: UIMessage[]; conversationId?: string } =
    await req.json();

  // Get user preferences
  const [user] = await db
    .select({
      role: users.role,
      aiProvider: users.aiProvider,
      subscriptionTier: users.subscriptionTier,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  const model = getModel(user.aiProvider);
  const systemPrompt = getSystemPrompt(user.role);

  // Save user message to DB if pro user and conversationId provided
  if (user.subscriptionTier === "pro" && conversationId) {
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg?.role === "user") {
      const textPart = lastMsg.parts?.find((p) => p.type === "text");
      const content = textPart && "text" in textPart ? textPart.text : "";
      if (content) {
        await db.insert(messages).values({
          conversationId,
          role: "user",
          content,
        });
      }
    }
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages: await convertToModelMessages(chatMessages),
    onFinish: async ({ text }) => {
      // Save assistant response to DB if pro user and conversationId provided
      if (user.subscriptionTier === "pro" && conversationId) {
        await db.insert(messages).values({
          conversationId,
          role: "assistant",
          content: text,
        });

        // Update conversation title from first exchange
        if (chatMessages.length === 1) {
          const firstMsg = chatMessages[0];
          const textPart = firstMsg.parts?.find((p) => p.type === "text");
          const firstText = textPart && "text" in textPart ? textPart.text : "New Chat";
          const title =
            firstText.slice(0, 80) + (firstText.length > 80 ? "..." : "");
          await db
            .update(conversations)
            .set({ title, updatedAt: new Date() })
            .where(eq(conversations.id, conversationId));
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
