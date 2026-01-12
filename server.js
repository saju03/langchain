import { ChatOllama } from "@langchain/ollama";
const model = new ChatOllama({
  model: "llama3.1",
});

const res = await model.invoke("Say hello in one line");
console.log(res.content);