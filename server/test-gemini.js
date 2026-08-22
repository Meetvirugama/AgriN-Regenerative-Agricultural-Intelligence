import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function test() {
  try {
    console.log("Testing gemini-1.5-flash...");
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: "Hello" }] }],
    });
    console.log("Success with 1.5-flash:", !!result.text);
  } catch (err) {
    console.error("Error 1.5-flash:", err.message);
  }
}

test();
