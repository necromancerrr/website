import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const { data: member, error } = await supabase
      .from("members")
      .select("first_name")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Error fetching member:", error);
      return NextResponse.json(
        { error: "Failed to fetch member" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: member,
      first_name: member?.first_name || null,
    });
  } catch (err) {
    console.error("Error in GET /api/members/first-name:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
