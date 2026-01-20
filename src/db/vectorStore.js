import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { embeddings } from "../model/embeddings.js";
import { supabase } from "./supabase.js";

export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: "memories",
  queryName: "match_memories",
});
export const vectorFileStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: "kb_documents",
  queryName: "match_kb_documents",
  
});
