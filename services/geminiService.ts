import { GoogleGenAI } from "@google/genai";
import { ThemeMode } from "../types";

// Helper to resize image to reduce payload size and ensure compatibility
const resizeImage = (base64Str: string, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Convert to efficient JPEG to ensure small payload
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      console.warn("Image resize failed, using original.");
      resolve(base64Str); // Fallback to original if load fails
    };
  });
};

export const generateCharacterImage = async (base64Image: string, mode: ThemeMode): Promise<string> => {
  try {
    // Resize image first to avoid payload limits (critical for mobile uploads)
    const resizedBase64 = await resizeImage(base64Image);

    // Initialize client inside function to ensure API key availability
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Extract correct MIME type from the Data URL
    const mimeMatch = resizedBase64.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    // Robustly extract base64 data
    const cleanBase64 = resizedBase64.includes(',') ? resizedBase64.split(',')[1] : resizedBase64;

    const model = 'gemini-2.5-flash-image';
    
    let prompt = '';

    if (mode === '24') {
      prompt = `
        Create a cinematic DVD cover art in the style of the TV show "24", featuring the person from the input image as a special agent.
        
        Visual Style Requirements:
        - Color Grading: Cool blue/cyan and black, high contrast, gritty texture.
        - Aesthetics: Digital noise, scanlines, split-screen composition elements.
        - Subject: The person should look intense, focused, and ready for action.
        - Overlay: Include a digital clock reading 23:59:59 in the background.
        
        Ensure the output is a high-quality, realistic image.
      `;
    } else {
      prompt = `
        Create a movie poster featuring the person from the input image dressed as a Christmas Elf (Buddy the Elf style).
        
        Visual Style Requirements:
        - Costume: Green tunic with white fur collar, yellow tights.
        - Background: A magical, snowy North Pole workshop or cityscape.
        - Atmosphere: Bright, joyful, high-key lighting, festive colors (Green, Red, Gold).
        - Expression: Cheerful and full of Christmas spirit.
        
        Ensure the output is a high-quality, realistic image.
      `;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        imageConfig: {
            aspectRatio: '3:4'
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ]
      }
    });

    const candidate = response.candidates?.[0];

    // 1. Check for blocking/safety issues at the candidate level
    if (candidate?.finishReason === 'SAFETY') {
        throw new Error("Security Protocol Engaged: Image content flagged by safety filters. Please try a different photo.");
    }
    if (candidate?.finishReason === 'OTHER') {
        throw new Error("Protocol Failed: Model processing error. Try reducing image complexity.");
    }

    // 2. Check for inline data (image)
    for (const part of candidate?.content?.parts || []) {
        if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
        }
    }

    // 3. Check for text refusal/explanation
    const textOutput = candidate?.content?.parts?.find(p => p.text)?.text;
    if (textOutput) {
        console.warn("Gemini returned text instead of image:", textOutput);
        if (textOutput.toLowerCase().includes("sorry") || textOutput.toLowerCase().includes("cannot")) {
             throw new Error("Request Denied: The model refused the prompt. Try a clearer face photo.");
        }
        throw new Error(`Model Response: ${textOutput.substring(0, 100)}...`);
    }

    // 4. Fallback if candidate exists but no parts found
    throw new Error("Transmission Incomplete: No image data received from satellite.");

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    
    // Convert API errors into user-friendly protocol messages
    const msg = error.toString();
    
    if (msg.includes("403")) {
        throw new Error("Access Denied: API Key invalid or expired.");
    }
    if (msg.includes("503")) {
        throw new Error("Network Congestion: CTU Servers overloaded. Please retry.");
    }
    if (msg.includes("400")) {
        throw new Error("Data Corruption: Invalid image format or prompt rejected.");
    }
    // Return the specific error message if we already threw it above, otherwise generic
    if (error instanceof Error) {
        return Promise.reject(error); // Pass the specific error up
    }
    
    throw new Error("System Failure: Unknown error occurred during generation.");
  }
};