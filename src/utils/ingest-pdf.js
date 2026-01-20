import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embeddings } from "../model/embeddings.js";
import { vectorFileStore } from "../db/vectorStore.js";
import { Document } from "langchain";
import { supabase } from "../db/supabase.js";

export async function ingest(userId) {
  try {
    debugger;
    const loader = new PDFLoader("src/docs/esign.pdf");
    const docs = await loader.load();
    console.log(`Loaded ${docs.length} pages`);

    // 2️  Split into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.splitDocuments(docs);
    console.log(`Created ${chunks.length} chunks`);

    // 4️ Store vectors

    // Add user_id to metadata
    const docsWithUserId = chunks.map(
      (c) =>
        new Document({
          pageContent: c.pageContent,
          metadata: { ...c.metadata, user_id: userId },
        }),
    );

    await vectorFileStore.addDocuments(docsWithUserId);

    console.log("PDF successfully indexed ✅");

    return vectorFileStore;
  } catch (error) {
    console.log(error);
  }
}

export async function retrieveKB(userId, query, topK = 5) {
  try {
    
    debugger;
    //  Create query embedding
    const queryEmbedding = await embeddings.embedQuery(query);
    //   Call Supabase RPC
    const { data, error } = await supabase.rpc("match_kb_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.5, // Added threshold
      match_count: topK,
      match_user_id: userId,
    });
     if (error) throw error;
    if (!data?.length) return [];

    // Return raw data
    return data.map((row) => ({ pageContent: row.content, metadata: row.metadata }));
  } catch (error) {
    console.log(error);
    throw error;
  }
}
