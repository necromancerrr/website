import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-admin";

interface CreateMemberBody {
  first_name: string;
  last_name: string;
  email: string;
  wallet_address?: string;
}

export async function POST(request: Request) {
  try {
    const body: CreateMemberBody = await request.json();

    const { data, error } = await supabase
      .from("members")
      .insert([
        {
          first_name: body.first_name,
          last_name: body.last_name,
          email: body.email,
          wallet_address: body.wallet_address || null,
          is_active: true,
          is_pending: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating member:", error);
      return NextResponse.json(
        { error: "Failed to create member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/members:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
