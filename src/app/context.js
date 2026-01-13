import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

export async function loadRecentMessages(supabase, sessionId, limit = 6) {
  const { data, error } = await supabase
    .from("messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // reverse to chronological order
  return data.reverse().map((msg) => {
    if (msg.role === "human") return new HumanMessage(msg.content);
    if (msg.role === "ai") return new AIMessage(msg.content);
    return new SystemMessage(msg.content);
  });
}