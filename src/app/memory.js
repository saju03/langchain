import { HumanMessage, SystemMessage } from "langchain";
import { chatModel } from "../model/chatModel.js";
import { vectorStore } from "../db/vectorStore.js";

async function findSimilarMemory(text, threshold = 0.9) {
  const results = await vectorStore.similaritySearchWithScore(text, 1);
  if (results.length === 0) return null;

  const [doc, score] = results[0];
  return score > threshold ? doc : null;
}

export async function decideMemory(userMessage) {
  const response = await chatModel.invoke([
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
- If no stable memory exists or contains not positive words like [not sure,unknown,i don't know,didn't say], return:
  { "shouldStore": false, "content": null }
- Convert facts into clear sentences.

Examples:
User: "My age is 23"
Output:
{ "shouldStore": true, "content": "User age is 23" }

User: "User’s name is unknown"
Output:
{ "shouldStore": false, "content": null }

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

export async function maybeSaveToMemory(memory) {
  if (!memory) return;

  const text = typeof memory === "string" ? memory : JSON.stringify(memory);

  await saveToMemory(text);
}

export async function saveToMemory(text, metadata = {}) {
  const existing = await findSimilarMemory(text);

  if (existing) {
    console.log("Updating existing memory");
    await vectorStore.client
      .from("memories")
      .update({
        content: text,
        metadata,
      })
      .eq("id", existing.metadata.id);
  } else {
    console.log("Inserting new memory");
    await vectorStore.addDocuments([{ pageContent: text, metadata }]);
  }
}

export async function retrieveMemory(query) {
  const retriever = vectorStore.asRetriever(3);
  return await retriever.invoke(query);
}


export async function retrieveRelevantMemories(
  vectorStore,
  userMessage,
  limit = 3
) {
  const results = await vectorStore.similaritySearch(userMessage, limit);

  if (!results.length) return "none";

  return results
    .map((r) => `• ${r.pageContent}`)
    .join("\n");
}