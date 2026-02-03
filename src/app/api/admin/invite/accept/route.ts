import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Get and validate invite
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invalid or expired invite" },
        { status: 400 },
      );
    }

    // Create user in Supabase Auth
    const { data: user, error: createError } =
      await supabase.auth.admin.createUser({
        email: invite.email,
        password: password,
        email_confirm: true, // Skip email verification - already verified via invite
      });

    if (createError) {
      console.error("Failed to create user:", createError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 },
      );
    }

    // Mark invite as used
    const { error: updateError } = await supabase
      .from("invites")
      .update({ used: true })
      .eq("token", token);

    if (updateError) {
      console.error("Failed to mark invite as used:", updateError);
      // User is created, so we don't fail the request
    }

    // Mark member as no longer pending
    const { error: memberError } = await supabase
      .from("members")
      .update({ is_pending: false })
      .eq("email", invite.email);

    if (memberError) {
      console.error("Failed to update member status:", memberError);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.user.id,
        email: user.user.email,
      },
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
