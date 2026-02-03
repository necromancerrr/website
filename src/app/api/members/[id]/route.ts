import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

interface UpdateMemberBody {
  first_name: string;
  last_name: string;
  email: string;
  wallet_address?: string | null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateMemberBody = await request.json();

    const { data, error } = await supabase
      .from("members")
      .update({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email,
        wallet_address: body.wallet_address || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating member:", error);
      return NextResponse.json(
        { error: "Failed to update member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error in PUT /api/members/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting member:", error);
      return NextResponse.json(
        { error: "Failed to delete member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /api/members/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
