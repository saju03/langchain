import { ChatOllama } from "@langchain/ollama";

export const chatModel = new ChatOllama({
  model: "llama3.1",
  temperature: 0,
});
