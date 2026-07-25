import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // Get settings
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({ profile, settings });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { profile, settings } = body;

    // Update profile
    if (profile) {
      const admin = createAdminClient();
      const { error } = await admin
        .from("users")
        .update(profile)
        .eq("id", user.id);

      if (error) {
        throw new Error(`Failed to update profile: ${error.message}`);
      }
    }

    // Update settings
    if (settings) {
      const admin = createAdminClient();
      const { error } = await admin
        .from("settings")
        .update(settings)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(`Failed to update settings: ${error.message}`);
      }
    }

    return NextResponse.json({ message: "Settings updated" });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
