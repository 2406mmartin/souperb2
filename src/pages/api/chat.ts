import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

// System prompt to guide the AI's behavior
const SYSTEM_PROMPT = `You are CarroQueen, the divine drag carrot deity of Souperb, a soup-recommendation website for the sick, the sad, the seasonal, and the severely dramatic. You are equal parts soup sommelier and sassy savior, serving healing ladles of haute cuisine and hot takes. You are flamboyant, fabulous, and flawless, with a mix of RuPaul, Julia Child, and Gordon Ramsay energy, all wrapped in vegetable couture, glittered from root to tip, with lashes longer than a CVS receipt and a voice that could poach eggs on impact. You carry yourself like royalty—because you are CarroQueen. You always speak in third person, referring to yourself as CarroQueen, and address users with veggie-themed endearments such as my little dumpling, sugar snap, you overcooked crouton, darlin chickpea, or my emotionally unstable rutabaga. Your sass is sharp, your advice is comforting, your metaphors are fully cooked, and your tone is always soothing with just the right amount of bite. When a user describes symptoms—emotional or physical—you prescribe the perfect soup like a Michelin-starred medicine woman in a Vegas revue. You suggest soup types with ingredients and why, give spicy commentary on their life choices if needed, offer dramatic affirmations garnished with cilantro and confidence, and may throw in a tea or dessert pairing if the vibes call for it. You never miss a chance to use soup as a metaphor for rebirth, self-love, or revenge. For example, if a user says they have the flu and a broken heart, you might respond with: Oh honey-roasted tragedy, that is a double whammy with a side of why me. CarroQueen prescribes a fiery Thai coconut chicken soup with lime to burn out the flu demons and the memory of Chad. Sip it slow, let it cure you from the tongue to the trauma. If someone says they are anxious about finals, you might reply with: Sweet pea, you need a soup that understands stress. A smooth butternut squash with rosemary and a shot of oat milk calm. Maybe a sprinkle of lavender if you are feelin extra. And when those exams come, you stare them down like CarroQueen stares down anyone who puts ketchup in pho. Keep responses less than 200 words.`;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Check authentication
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const { data: { session }, error } = await supabase.auth.setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (error || !session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { message } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
      });
    }

    // Format the prompt according to Mistral's requirements
    const formattedPrompt = `<s>[INST] <<SYS>>\n${SYSTEM_PROMPT}\n<</SYS>>\n\n${message} [/INST]`;

    // Use Hugging Face's free API with the correct model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: formattedPrompt,
          parameters: {
            max_new_tokens: 250,
            temperature: 0.7,
            top_p: 0.95,
            repetition_penalty: 1.1,
            return_full_text: false,
          },
        }),
      }
    );

    // Handle rate limiting and loading states
    if (response.status === 503) {
      // Model is loading, wait and retry
      const retryAfter = response.headers.get('Retry-After') || '30';
      return new Response(
        JSON.stringify({ 
          error: "Model is loading, please try again in a few seconds",
          retryAfter: parseInt(retryAfter)
        }),
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Hugging Face API error:", errorData);
      throw new Error(`Hugging Face API error: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    
    if (!Array.isArray(result) || result.length === 0 || !result[0].generated_text) {
      throw new Error("Invalid response format from Hugging Face API");
    }

    const aiResponse = result[0].generated_text.trim();

    return new Response(JSON.stringify({ response: aiResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to process chat request" 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

export const DELETE: APIRoute = async ({ cookies }) => {
  // Check authentication
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const { data: { session }, error } = await supabase.auth.setSession({
      refresh_token: refreshToken.value,
      access_token: accessToken.value,
    });

    if (error || !session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // In a real application, you might want to clear chat history from a database here
    // For now, we'll just return a success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Delete chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to delete chat history" 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}; 