import { OllamaEmbeddings } from "@langchain/ollama";

export const embeddings = new OllamaEmbeddings({
  baseUrl: "http://127.0.0.1:11434",
  model: "nomic-embed-text",
});