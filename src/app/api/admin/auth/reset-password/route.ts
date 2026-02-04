import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // check if email is valid
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json(
        { error: "Email not found in body. Email is required" },
        { status: 400 },
      );
    }

    // check if member exist
    const { data: existingMember } = await supabase
      .from("members")
      .select("*")
      .eq("email", email)
      .single();
    if (!existingMember) {
      return NextResponse.json(
        {
          error:
            "User doesn't exist yet. Please reach UW Blockchain team for more details.",
        },
        { status: 400 },
      );
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // store password reset token
    const { error: insertError } = await supabase
      .from("password_reset_invites")
      .insert({
        email,
        token,
        expires_at: expiresAt.toISOString(),
      });
    if (insertError) {
      console.error("Failed to create password reset invite");
      return NextResponse.json(
        { error: "Failed to create password reset invite" },
        { status: 500 },
      );
    }

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/career-portal/auth/reset-password/confirm?token=${token}`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "UW Blockchain: Reset Password <noreply@uwblockchain.org>",
        to: email,
        subject: "UW Blockchain: Reset Your Password",
        html: `
      <h2>Reset your account password</h2>
      <p>Click the link below to reset your account password:</p>
      <a href="${resetLink}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #000;
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
      ">Set up your account</a>
      <p>If the button doesn't work, copy and paste this url: ${resetLink}</p>
      <p style="color: #666; margin-top: 24px;">
        This link expires in 24 hours.
      </p>
    `,
      }),
    });
    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Failed to send email:", errorData);
      // Rollback the invite
      await supabase.from("password_reset_invites").delete().eq("token", token);
      return NextResponse.json(
        { error: "Failed to send password reset invite email" },
        { status: 500 },
      );
    } else {
      console.log("Email sent to user!")
    }

    // Return success response
    return NextResponse.json(
      { success: true, message: "Password reset email sent successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.log("Error creating a request for user password reset: ", err);
    return NextResponse.json(
      {
        error: "Error creating a request for password reset",
      },
      { status: 500 },
    );
  }
}
