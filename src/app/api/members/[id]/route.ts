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
    
    // First, get the member's email to find them in auth
    const { data: member, error: fetchError } = await supabase
      .from("members")
      .select("email")
      .eq("id", id)
      .single();
    
    if (fetchError) {
      console.error("Error fetching member:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch member" },
        { status: 500 }
      );
    }
    
    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }
    
    const memberEmail = member.email;
    
    // Delete from members table
    const { error: deleteError } = await supabase
      .from("members")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting member:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete member" },
        { status: 500 }
      );
    }
    
    // Try to delete from profiles table if it exists
    try {
      await supabase
        .from("profiles")
        .delete()
        .eq("email", memberEmail);
    } catch (profileError) {
      // Profiles table might not exist, log but don't fail
      console.log("Note: Could not delete from profiles table:", profileError);
    }
    
    // Try to delete user from Supabase Auth
    try {
      // First, find the user by email in auth
      const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      
      if (userError) {
        console.error("Error listing auth users:", userError);
      } else {
        // Find user by email
        const userToDelete = userData.users.find(u => u.email === memberEmail);
        
        if (userToDelete) {
          const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
            userToDelete.id
          );
          
          if (authDeleteError) {
            console.error("Error deleting user from auth:", authDeleteError);
          } else {
            console.log("Successfully deleted user from Supabase Auth:", memberEmail);
          }
        } else {
          console.log("User not found in auth system:", memberEmail);
        }
      }
    } catch (authError) {
      // Auth operations might fail, log but don't fail the overall deletion
      console.error("Error during auth cleanup:", authError);
    }

    return NextResponse.json({ 
      success: true,
      message: "Member removed from career portal" 
    });
  } catch (err) {
    console.error("Error in DELETE /api/members/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
