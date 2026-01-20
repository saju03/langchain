import { searchUserPdfsTool } from "../app/tools.js";
import { llm } from "../model/Model.js";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
const agent = createReactAgent({
  llm,
  tools: [searchUserPdfsTool],
});

export default agent;