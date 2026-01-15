import { ChatOllama } from "@langchain/ollama";
import { getUserMemories } from "../app/tools.js";


export const chatModel = new ChatOllama({
  model: "llama3.1",
  temperature: 0,
}).bindTools([getUserMemories]);
