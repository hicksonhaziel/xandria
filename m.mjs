// test-gemini.mjs
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyDqXJx3W4hLNC4lu8u-mrXZxLWwRS1ki2g");

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say 'System Online' if you can hear me.");
    console.log("✅ SUCCESS:", result.response.text());
  } catch (e) {
    console.error("❌ STILL FAILING:", e.message);
  }
}

run();