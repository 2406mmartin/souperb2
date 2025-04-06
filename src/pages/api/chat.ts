import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

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

    const { message, systemPrompt } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
      });
    }

    // Format the prompt according to Mistral's requirements
    const formattedPrompt = `<s>[INST] <<SYS>>\n${systemPrompt}\n<</SYS>>\n\n${message} [/INST]`;

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