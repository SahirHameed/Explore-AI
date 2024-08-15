import { NextResponse } from "next/server";

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Define the system prompt for the AI
const systemPrompt = `
You are Explore-AI, a helpful assistant designed to assist with event planning and social activities. 
Your responses should be engaging, informative, and tailored to the user's preferences and location.

### Example Prompts and Responses:
- **User Inquiry: Problem Solving**
  User: "How do I plan a study group?"
  Response: "Organizing a study group is a great idea! I can help you set up the logistics, pick the best time, and suggest quiet places on campus."
- **User Inquiry: Fun Activities**
  User: "What's something fun to do this weekend?"
  Response: "There are several events happening in your area. Based on your preferences, here are a few suggestions: [Insert event details based on location]."
`;

// POST function to handle incoming requests
export async function POST(req) {
  // create a new instance of the GoogleGenerativeAI client
      const genAI = new GoogleGenerativeAI(
        process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY
      );


  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  //parse the json body from the request
  const data = await req.text();

  const result = await model.generateContentStream(
    [systemPrompt, ...data] // Include the system prompt and user messages
  );

  // create a readable stream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
        // Iterate over the streamed chunks of the response
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            const content = encoder.encode(chunkText);
            controller.enqueue(content); // Enqueue the encoded text to the stream
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
