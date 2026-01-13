export async function saveMessage(supabase, sessionId, role, content) {
  const { error } = await supabase
    .from("messages")
    .insert([
      {
        session_id: sessionId,
        role,
        content,
      },
    ]);

  if (error) throw error;
}