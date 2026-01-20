import { HumanMessage, SystemMessage } from "langchain";
import {  JSONModel } from "../model/Model.js";
import { vectorStore } from "../db/vectorStore.js";

async function findSimilarMemory(text, metadata = {}, threshold = 0.9) {
  const filter = metadata.user_id ? { user_id: metadata.user_id } : {};
  const results = await vectorStore.similaritySearchWithScore(text, 1, filter);
  if (results.length === 0) return null;

  const [doc, score] = results[0];
  return score > threshold ? doc : null;
}

export async function decideMemory(userMessage) {
  try {
    const response = await JSONModel.invoke([
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
- Always return a valid JSON in the format specified above.
- If no stable memory exists or contains not positive words like [not sure,unknown,i don't know,didn't say], return:
  { "shouldStore": false, "content": null }
- Do not store questions asked by the user or the AI.
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
    
    if (response.content) {
      return JSON.parse(response.content);
    }
   
    else {
      return null;
    }

  } catch (error) {
    console.log(error);
    return null;
  }



}

export async function maybeSaveToMemory(memory, metadata = {}) {
  if (!memory) return;

  const text = typeof memory === "string" ? memory : JSON.stringify(memory);

  await saveToMemory(text, metadata);
}

export async function saveToMemory(text, metadata = {}) {
  const existing = await findSimilarMemory(text, metadata);

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

export async function retrieveMemory(query, currentUserId) {
  const retriever = vectorStore.asRetriever(3);
  return await retriever.invoke(query, {
    filter: {
      user_id: currentUserId
    }
  });
}

export async function retrieveRelevantMemories(
  vectorStore,
  userMessage,
  currentUserId,
  limit = 3
) {
  if (!currentUserId) return [];

  console.log(`Retrieving memories for user ${currentUserId} with query: "${userMessage}"`);

  const results = await vectorStore.similaritySearch(
    userMessage,
    limit,
    {
      user_id: currentUserId, // MUST be string
    }
  );

  console.log("Retrieved memories:", results.map(r => r.pageContent));

  return results;
}
