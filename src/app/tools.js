import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { vectorStore } from "../db/vectorStore.js";


export const getUserMemories = tool(
  async ({ query }, config) => {
    try {
      const userId = config?.configurable?.userId;
      if (!userId) {
        throw new Error("userId missing in tool config");
      }

      const results = await vectorStore.similaritySearch(
        query,
        6,
        {
          user_id: String(userId), // 🔒 force string
        }
      );
      return results;
    } catch (error) {
      console.log(error);
    }

  },
  {
    name: "get_user_memories",
    description: "Fetch stored long-term memories for a given user",
    schema: z.object({
      query: z.string().describe("The search query to find relevant memories"),
    }),
  }
);


