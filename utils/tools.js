const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function grammer(text) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: "Correct the grammar of this text: " + text }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.STRING,
      },
    },
  });

  return response.text;
}

async function newInfo(text) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: "Give new info (max 50 words) about: " + text }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.STRING,
      },
    },
  });

  return response.text;
}

async function translate(text, targetLang) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Translate the following text to ${targetLang}: ${text}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.STRING,
      },
    },
  });

  return response.text;
}

module.exports = {
  grammer,
  newInfo,
  translate,
};