import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data: members, error } = await supabase
      .from("members")
      .select("*")
      .not("id", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching members:", error);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: members });
  } catch (err) {
    console.error("Error in GET /api/members:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
