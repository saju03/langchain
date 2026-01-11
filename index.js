import dotenv from "dotenv";
dotenv.config();


import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import {
  SystemMessage,
  HumanMessage,
  AIMessage
} from "@langchain/core/messages";

const max_msg = 4


const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});


let chatMemory = [];

const summarizeMessage = async (messages) => {
  const summarizerPrompt = [
    new SystemMessage(`
      "You are a memory manager.
         Rules:
      -  This is ground truth. Do not hallucinate.
      - NEVER delete existing values unless explicitly contradicted 
      - If a value is missing in new messages, keep the old value
      - Only update fields if new information is clearly stated
      - Output ONLY valid JSON
      Maintain a JSON object like the following fields:
      {
        "name": string ,
        "age": number ,
        
      }
    "`

    ),
    ...messages,
  ];

  const response = await model.invoke(summarizerPrompt)

  return response.content;
}

chatMemory.push(new SystemMessage('You are a helpful chatbot. Remember what the user tells you.'));


// capped memory****************

// const invokeModel = async (userMessage) => {

//   // 1. store user message
//   chatMemory.push(new HumanMessage(userMessage));


//   const systemMessage = chatMemory[0];
//   const recentMessages = chatMemory.slice(-max_msg)
//   console.log(recentMessages);

//   chatMemory = [];
//   chatMemory.push(systemMessage, ...recentMessages)
//   debugger

//   // 2. call the model with FULL memory
//   const response = await model.invoke(chatMemory);

//   chatMemory.push(new AIMessage(response.content));

//   // 4. return reply
//   return response.content;
// }




const invokeModel = async (userMessage) => {

  // 1. store user message
  chatMemory.push(new HumanMessage(userMessage));

  // Separate system summary and others
  const systemMessage = chatMemory.find(
    (msg) => msg instanceof SystemMessage
  );



  const nonSystemMessages = chatMemory.filter(
    (msg) => !(msg instanceof SystemMessage)
  );

  // 🔥 SUMMARIZE OLD MESSAGES
  if (nonSystemMessages.length > max_msg) {
    const oldMessages = nonSystemMessages.slice(
      0,
      nonSystemMessages.length - max_msg
    );

    const Conversation_tillNowSummary = [systemMessage,...oldMessages]

    const summary = await summarizeMessage(Conversation_tillNowSummary);
    debugger
    // Replace system message with updated summary
    chatMemory = [];
    chatMemory.push(
      new SystemMessage(`Conversation summary: ${summary}`),
      ...nonSystemMessages.slice(-max_msg)
    );
  }



  // 2. call the model with FULL memory
  const response = await model.invoke(chatMemory);

  chatMemory.push(new AIMessage(response.content));

  // 4. return reply
  return response.content;
}



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