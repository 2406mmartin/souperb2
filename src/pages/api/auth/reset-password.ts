import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { password, access_token } = await request.json();

    if (!password || !access_token) {
      return new Response(
        JSON.stringify({ error: "Password and access token are required" }),
        { status: 400 }
      );
    }

    // Basic password validation
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters long" }),
        { status: 400 }
      );
    }

    // Use Supabase's update user function to set the new password
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      console.error("Password reset error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to reset password. The link may have expired." 
        }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: "Password reset successful" 
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred. Please try again." 
      }),
      { status: 500 }
    );
  }
}; 