import "dotenv/config";

import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { chatModel } from "./model/chatModel.js";
import { decideMemory, maybeSaveToMemory, retrieveMemory, retrieveRelevantMemories } from "./app/memory.js";
import { supabase } from "./db/supabase.js";
import { saveMessage } from "./app/messages.js";
import { loadRecentMessages } from "./app/context.js";
import { vectorStore } from "./db/vectorStore.js";
import { getUserMemories } from "./app/tools.js";



const userId = "user_andmais";
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
    

      const r = await chatModel.invoke(
    'What do you remember about me?',
    {
      configurable: {
        userId: userId,
        sessionId: sessionId,
      },
    }
  );
  debugger
if (r.tool_calls?.length) {
  for (const call of r.tool_calls) {
    if (call.name === "get_user_memories") {
      const result = await getUserMemories.invoke(call.args);

      console.log("Tool output:", result);
    }
  }
}




debugger


    // Decide whether to store long-term memory
    const memoryDecision = await decideMemory(userMessage);

    if (memoryDecision?.shouldStore) {
      await maybeSaveToMemory(memoryDecision.content, {
        type: "user_memory",
        user_id: userId,
      });
    }

    //  Retrieve relevant vector memories
    const relevantMemories = await retrieveRelevantMemories(vectorStore, userMessage, userId);

    //  Load recent session messages (WITHOUT current user message)
    const recentMessages = await loadRecentMessages(supabase, sessionId, MAX_MESSAGES);

    //  Build system prompt
    //  Build system prompt
    const memoryText = relevantMemories.map((mem) => mem.pageContent).join("\n");
    const systemPrompt = `You are a helpful chatbot.
    Use the memory below ONLY if relevant.
    Long-term memory:
    ${memoryText}`;

    const messages = [new SystemMessage(systemPrompt), ...recentMessages, new HumanMessage(userMessage)];
    //  Invoke model
    const response = await chatModel.invoke(messages);

    //  Save messages
    await saveMessage(supabase, sessionId, "human", userMessage);
    await saveMessage(supabase, sessionId, "ai", response.content);

    return response.content;
  } catch (error) {
    console.log(error);
  }
};

async function run() {
  console.log(await invokeModel("what is my name"));
  // console.log(await invokeModel("my name is saju "));
  // console.log(await invokeModel("My age is 20"));
  // console.log(await invokeModel("My fav letter is v"));
  // console.log(await invokeModel("My dog is too friendly"));
  // console.log(await invokeModel("My dog is a labrador"));
  // console.log(await invokeModel("My dog has a white tail and black body"));

  // console.log(await invokeModel("What is my name?"));
}

run();

export default invokeModel;
