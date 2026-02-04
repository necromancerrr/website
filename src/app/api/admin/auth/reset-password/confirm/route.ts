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

    // Get and validate reset token
    const { data: resetInvite, error: inviteError } = await supabase
      .from("password_reset_invites")
      .select("*")
      .eq("token", token)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (inviteError || !resetInvite) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    // Find the user in Supabase Auth by email
    const { data: userData, error: userError } = await supabase
      .auth
      .admin
      .listUsers();

    if (userError) {
      console.error("Failed to list users:", userError);
      return NextResponse.json(
        { error: "Failed to find user" },
        { status: 500 },
      );
    }

    const user = userData.users.find((u) => u.email === resetInvite.email);

    if (!user) {
      return NextResponse.json(
        { error: "User not found in authentication system" },
        { status: 404 },
      );
    }

    // Update user's password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: password }
    );

    if (updateError) {
      console.error("Failed to update password:", updateError);
      return NextResponse.json(
        { error: "Failed to reset password" },
        { status: 500 },
      );
    }

    // Mark reset token as used
    const { error: markUsedError } = await supabase
      .from("password_reset_invites")
      .update({ used: true })
      .eq("token", token);

    if (markUsedError) {
      console.error("Failed to mark token as used:", markUsedError);
      // Password is already updated, so we don't fail the request
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset confirm error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
