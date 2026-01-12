
const summarizeMessage = async (messages) => {
  const summarizerPrompt = [
    new SystemMessage(`
      "You are a memory manager.
         Rules:
      - This is ground truth. Do not hallucinate.
      - Add fiels according to the data that is shared for example if user says fav letter is something add to new fields
      - NEVER delete existing values unless explicitly contradicted 
      - If a value is missing in new messages, keep the old value
      - Only update fields if new information is clearly stated
      - Output ONLY valid JSON
      Maintain a JSON object like the following fields:
      {
        "name": string ,
        "age": number ,
        
      }
    "`),
    ...messages,
  ];

  const response = await model.invoke(summarizerPrompt);

  return response.content;
};


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

  // *********** Summerize the chat to enhance memory ************\

  // // 1. store user message
  // chatMemory.push(new HumanMessage(userMessage));

  // // Separate system summary and others
  // const systemMessage = chatMemory.find(
  //   (msg) => msg instanceof SystemMessage
  // );

  // const nonSystemMessages = chatMemory.filter(
  //   (msg) => !(msg instanceof SystemMessage)
  // );

  // // 🔥 SUMMARIZE OLD MESSAGES
  // if (nonSystemMessages.length > max_msg) {
  //   const oldMessages = nonSystemMessages.slice(
  //     0,
  //     nonSystemMessages.length - max_msg
  //   );

  //   const Conversation_tillNowSummary = [systemMessage,...oldMessages]

  //   const summary = await summarizeMessage(Conversation_tillNowSummary);
  //   // Replace system message with updated summary
  //   chatMemory = [];
  //   chatMemory.push(
  //     new SystemMessage(`Conversation summary: ${summary}`),
  //     ...nonSystemMessages.slice(-max_msg)
  //   );
  // }

  // // 2. call the model with FULL memory
  // const response = await model.invoke(chatMemory);

  // chatMemory.push(new AIMessage(response.content));

  // // 4. return reply
  // return response.content;