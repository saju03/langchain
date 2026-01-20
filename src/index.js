import "dotenv/config";

import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { chatModel, summarizeModel } from "./model/Model.js";
import { decideMemory, maybeSaveToMemory, retrieveMemory, retrieveRelevantMemories } from "./app/memory.js";
import { supabase } from "./db/supabase.js";
import { saveMessage } from "./app/messages.js";
import { loadRecentMessages } from "./app/context.js";
import { getUserMemories } from "./app/tools.js";
import agent from "./agent/agents.js";
import { ingest } from "./utils/ingest-pdf.js";

const userId = "00000000-0000-0000-0000-000000000001";
const MAX_MESSAGES = 6; // 3 user + 3 AI
let sessionId = null;

async function createSession() {
  const { data, error } = await supabase
    .from("sessions")
    .insert([{ user_id: userId }])
    .select()
    .single();

  if (error) throw error;

  return data.id;
}

if (!sessionId) {
  sessionId = await createSession();
  console.log("New session:", sessionId);
}

const invokeModel = async (userMessage) => {
  try {
    // Decide whether to store long-term memory
    const memoryDecision = await decideMemory(userMessage);
    debugger;
    if (memoryDecision?.shouldStore) {
      await maybeSaveToMemory(memoryDecision.content, {
        type: "user_memory",
        user_id: userId,
      });
    }

    const isToolRequired = await chatModel.invoke([
      new SystemMessage(`
You are a memory extraction system.
Check does this user message require any tool to be called or not.if yes retrun the tool name and arguments.


`),
      new HumanMessage(userMessage),
    ]);

    // this section needs to be called form tool based model to work
    let relevantMemories = [];
    if (isToolRequired.tool_calls?.length) {
      for (const call of isToolRequired.tool_calls) {
        if (call.name === "get_user_memories") {
          const result = await getUserMemories.invoke(call.args, { configurable: { userId } });
          relevantMemories.push(result);

          console.log("Tool output:", result);
        }
      }
    }

    //  Load recent session messages (WITHOUT current user message)
    const recentMessages = await loadRecentMessages(supabase, sessionId, MAX_MESSAGES);

    //  Build system prompt

    const memoryText = relevantMemories[0].map((mem) => `- ${mem.pageContent}`).join("\n");
    const systemPrompt = `You are a helpful chatbot.
    Here are some things you know about the user from previous conversations:
    ${memoryText}
    
    Use the above information to answer the user's question if relevant.`;

    const messages = [new SystemMessage(systemPrompt), ...recentMessages, new HumanMessage(userMessage)];
    //  Invoke model
    const response = await summarizeModel.invoke(messages);

    //  Save messages
    await saveMessage(supabase, sessionId, "human", userMessage);
    await saveMessage(supabase, sessionId, "ai", response.content);

    return response.content;
  } catch (error) {
    console.log(error);
  }
};
const userQuery = "What are the terms and condition mentioned in the report";

const res = await agent.invoke({ messages: [{ role: "user", content: userQuery }] }, { configurable: { userId } });

console.log("Agent response:", res.messages[res.messages.length - 1].content);
async function run() {
  // console.log(await invokeModel("my name is saju "));
  // console.log(await invokeModel("My age is 20"));
  // console.log(await invokeModel("My fav letter is v"));
  // console.log(await invokeModel("My dog is too friendly"));
  // console.log(await invokeModel("My dog is a labrador"));
  // console.log(await invokeModel("My dog has a white tail and black body"));

  console.log(await invokeModel("What do you know about me"));
}

// run();
// ingest(userId)

export default invokeModel;
