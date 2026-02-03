import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

interface ToggleActiveBody {
  is_active: boolean;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: ToggleActiveBody = await request.json();

    const { data, error } = await supabase
      .from("members")
      .update({ is_active: body.is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling member active status:", error);
      return NextResponse.json(
        { error: "Failed to update member status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error in PUT /api/members/[id]/toggle-active:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
