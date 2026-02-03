import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // check if this email has a pending invite
    const { data: existingInvite } = await supabase
      .from("invites")
      .select("*")
      .eq("email", email)
      .eq("used", false)
      .gt("expired_at", new Date().toISOString())
      .single();
    if (existingInvite) {
      return NextResponse.json(
        { error: "Invite already sent!" },
        { status: 400 },
      );
    }

    // check if user already exists in auth
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some((u) => u.email === email);
    if (userExists) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    // generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // store invite
    const { error: insertError } = await supabase.from("invites").insert({
      email,
      token,
      expires_at: expiresAt.toISOString(),
    });
    if (insertError) {
      console.error("Failed to create invite");
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 },
      );
    }

    // send email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'www.uwblockchain.org';
    const setupLink = `${appUrl}/career-portal/setup?token=${token}`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "invites@uwblockchain.org",
        reply_to: "blockchn@uw.edu",
        to: email,
        subject: "UW Blockchain: You've been invited to join UW Career Portal",
        html: `
      <h2>You've been invited!</h2>
      <p>Click the link below to set up your account:</p>
      <a href="${setupLink}" style="
        display: inline-block;
        padding: 12px 24px;
        background-color: #000;
        color: #fff;
        text-decoration: none;
        border-radius: 6px;
      ">Set up your account</a>
      <p>If the button doesn't work, copy and paste this url: ${setupLink}</p>
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
      await supabase.from("invites").delete().eq("token", token);
      return NextResponse.json(
        { error: "Failed to send invite email" },
        { status: 500 },
      );
    } else {
      console.log("Email sent to user!");
    }

    return NextResponse.json({
      status: 200,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Error sending invite email to user: ",
        err,
      },
      { status: 500 },
    );
  }
}
