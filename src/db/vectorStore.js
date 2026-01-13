import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { embeddings } from "../model/embeddings.js";
import { supabase } from "./supabase.js";



export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: "memories",
  queryName: "match_memories",
});
