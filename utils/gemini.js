const { GoogleGenAI, Type } = require("@google/genai");
const { grammer, newInfo } = require("./tools.js"); // rename tools.mjs to tools.js and convert similarly

  // Configure the Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  async function gemini(prompt, body) {
    const grammerFunction = {
      name: "get_grammer_correction",
      description: "Corrects the Grammar of a given text",
      parameters: {
        type: Type.OBJECT,
        properties: {},
      },
    };

    const newInfoFunction = {
      name: "get_new_info",
      description: "Generates new information about the body text",
      parameters: {
        type: Type.OBJECT,
        properties: {},
      },
    };

    const noFunction = {
      name: "no_function",
      description: "Called when No function is required",
      parameters: {
        type: Type.OBJECT,
        properties: {},
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            //  get_grammer_correction or get_new_info
            {
              text: `Decide if the user input below needs function call If not then call the no_function.
                    Input: ${prompt}`,
            },
          ],
        },
      ],
      config: {
        tools: [
          {
            functionDeclarations: [grammerFunction, newInfoFunction, noFunction],
          },
        ],
      },
    });
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      console.log("Function Call:", functionCall.name);

      if (functionCall.name === "get_grammer_correction") {
        return await grammer(body);
      } else if (functionCall.name === "get_new_info") {
        return await newInfo(body);
      } else if (functionCall.name === "no_function") {
        return "no_function";
      }
    }
    return "no_function";
  }

module.exports = gemini;
