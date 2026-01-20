import { ChatOllama } from "@langchain/ollama";
import { getUserMemories } from "../app/tools.js";


export const llm = new ChatOllama({
  baseUrl: "http://127.0.0.1:11434", // 🔴 FORCE LOCALHOST
  model: "llama3.1",
  temperature: 0,
});
 

export const JSONModel = new ChatOllama({
  baseUrl: "http://127.0.0.1:11434", // 🔴 FORCE LOCALHOST
  model: "llama3.1",
  temperature: 0,
})

export const chatModel = new ChatOllama({
  baseUrl: "http://127.0.0.1:11434", // 🔴 FORCE LOCALHOST
  model: "llama3.1",
  temperature: 0.7,
}).bindTools([getUserMemories]);


export const summarizeModel = new ChatOllama({
  baseUrl: "http://127.0.0.1:11434", // 🔴 FORCE LOCALHOST
  model: "llama3.1",
  temperature: 0.7,
});


