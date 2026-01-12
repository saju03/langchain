import "dotenv/config";
import { OllamaEmbeddings } from "@langchain/ollama";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatOllama } from "@langchain/ollama";

const max_msg = 4;

const model = new ChatOllama({
  model: "llama3.1",
  temperature: 0,
});


const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
});

const vectorStore = await MemoryVectorStore.fromTexts([], [], embeddings);

async function saveToMemory(text, metadata = {}) {
  await vectorStore.addDocuments([
    {
      pageContent: text,
      metadata,
    },
  ]);
  console.log("Stored memory:", text);
}

async function maybeSaveToMemory(memory) {
  if (!memory) return;

  const text = typeof memory === "string" ? memory : JSON.stringify(memory);

  await saveToMemory(text);
}

async function decideMemory(userMessage) {
  const response = await model.invoke([
    new SystemMessage(`
You are a memory extraction system.

Return ONLY valid JSON.
Do not explain anything.

Schema:
{
  "shouldStore": boolean,
  "content": string | null
}

Rules:
- If no stable memory exists, return:
  { "shouldStore": false, "content": null }
- Convert facts into clear sentences.

Examples:
User: "My age is 23"
Output:
{ "shouldStore": true, "content": "User age is 23" }

User: "Hello"
Output:
{ "shouldStore": false, "content": null }
`),
    new HumanMessage(userMessage),
  ]);

  try {
    return JSON.parse(response.content);
  } catch {
    return null;
  }
}

async function retrieveMemory(query) {
  const retriever = vectorStore.asRetriever(3);
  return await retriever.invoke(query);
}

const invokeModel = async (userMessage) => {
  try {
    const memoryDecision = await decideMemory(userMessage);
    if (memoryDecision?.shouldStore) {
      const res = await maybeSaveToMemory(memoryDecision.content, {
        type: "user_memory",
      });
    }
    const relevantMemory = await retrieveMemory(userMessage);
    debugger;

    const memoryText = relevantMemory.map((m) => `- ${m.pageContent}`).join("\n");

    const messages = [
      new SystemMessage(`You are a helpful chatbot.
Use the memory below ONLY if relevant.

Memory:
${memoryText || "None"}
    `),
      new HumanMessage(userMessage),
    ];

    const response = await model.invoke(messages);
    return response.content;
  } catch (error) {
    console.log(error);
  }
};

async function run() {
  console.log(await invokeModel("My name is Saju"));
  console.log(await invokeModel("My age is 23"));
  console.log(await invokeModel("My fav letter is v"));
  console.log(await invokeModel("My dog is too friendly"));
  console.log(await invokeModel("My dog is a labrador"));
  console.log(await invokeModel("My dog has a white tail and black body"));

  console.log(await invokeModel("What is my age?"));
}

run();

export default invokeModel;
