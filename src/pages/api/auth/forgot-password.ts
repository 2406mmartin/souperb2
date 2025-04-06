import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400 }
      );
    }

    // Use Supabase's reset password email function
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.SITE_URL}/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send password reset email. Please try again." 
        }),
        { status: 500 }
      );
    }

    // Always return success to prevent email enumeration
    return new Response(
      JSON.stringify({ 
        message: "If an account exists with this email, you will receive a password reset link." 
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