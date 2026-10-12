import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/access";

type ControlAction =
  | "freeze"
  | "unfreeze"
  | "cash"
  | "energy"
  | "reputation"
  | "experience"
  | "location"
  | "reset";

interface RequestBody {
  action?: ControlAction;
  amount?: number;
  value?: number;
  locationId?: string;
  reason?: string;
}

function numberOrNull(value: unknown) {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  return value;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    const { id: targetUserId } = await context.params;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Player ID is required." },
        { status: 400 }
      );
    }

    if (targetUserId === admin.id) {
      return NextResponse.json(
        {
          error:
            "You cannot use player controls on your own administrator account.",
        },
        { status: 400 }
      );
    }

    const body = (await request.json()) as RequestBody;

    const action = body.action;

    const allowedActions: ControlAction[] = [
      "freeze",
      "unfreeze",
      "cash",
      "energy",
      "reputation",
      "experience",
      "location",
      "reset",
    ];

    if (!action || !allowedActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid admin action." },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // -----------------------------------------------------
    // Make sure the player exists
    // -----------------------------------------------------

    const { data: profile, error: profileError } = await supabase
      .from("player_profiles")
      .select("id, username, display_name")
      .eq("id", targetUserId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Player not found." },
        { status: 404 }
      );
    }

    // -----------------------------------------------------
    // Get current game state
    // -----------------------------------------------------

    const { data: existingState, error: stateError } = await supabase
      .from("player_game_states")
      .select(
        `
        user_id,
        cash,
        energy,
        max_energy,
        reputation,
        current_job_id,
        job_experience,
        current_location_id,
        is_frozen
        `
      )
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (stateError) {
      return NextResponse.json(
        { error: stateError.message },
        { status: 500 }
      );
    }

    // -----------------------------------------------------
    // Create state if player doesn't have one yet
    // -----------------------------------------------------

    let currentState = existingState;

    if (!currentState) {
      const { data: createdState, error: createError } = await supabase
        .from("player_game_states")
        .insert({
          user_id: targetUserId,
          cash: 10000,
          energy: 100,
          max_energy: 100,
          reputation: 0,
          current_job_id: null,
          job_experience: 0,
          current_location_id:
            profile.id === targetUserId
              ? "garki"
              : "garki",
          is_frozen: false,
        })
        .select(
          `
          user_id,
          cash,
          energy,
          max_energy,
          reputation,
          current_job_id,
          job_experience,
          current_location_id,
          is_frozen
          `
        )
        .single();

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 500 }
        );
      }

      currentState = createdState;
    }

    // -----------------------------------------------------
    // FREEZE
    // -----------------------------------------------------

    if (action === "freeze" || action === "unfreeze") {
      const frozen = action === "freeze";

      const { error } = await supabase
        .from("player_game_states")
        .update({
          is_frozen: frozen,
        })
        .eq("user_id", targetUserId);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      await supabase.from("admin_player_actions").insert({
        admin_user_id: admin.id,
        target_user_id: targetUserId,
        action,
        reason: body.reason?.trim() || null,
        metadata: {
          previousFrozen: currentState.is_frozen ?? false,
          newFrozen: frozen,
        },
      });

      return NextResponse.json({
        success: true,
        action,
        isFrozen: frozen,
      });
    }

    // -----------------------------------------------------
    // CASH
    // -----------------------------------------------------

    if (action === "cash") {
      const amount = numberOrNull(body.amount);

      if (amount === null || amount === 0) {
        return NextResponse.json(
          { error: "Enter a valid cash adjustment." },
          { status: 400 }
        );
      }

      const currentCash = Number(currentState.cash ?? 0);
      const newCash = currentCash + amount;

      if (newCash < 0) {
        return NextResponse.json(
          {
            error:
              "This adjustment would make the player's cash negative.",
          },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("player_game_states")
        .update({
          cash: newCash,
        })
        .eq("user_id", targetUserId);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      await supabase.from("admin_player_actions").insert({
        admin_user_id: admin.id,
        target_user_id: targetUserId,
        action: "cash",
        amount,
        reason: body.reason?.trim() || null,
        metadata: {
          previousCash: currentCash,
          newCash,
        },
      });

      return NextResponse.json({
        success: true,
        action: "cash",
        previousCash: currentCash,
        newCash,
      });
    }

    // -----------------------------------------------------
    // ENERGY
    // -----------------------------------------------------

    if (action === "energy") {
      const value = numberOrNull(body.value);

      if (value === null) {
        return NextResponse.json(
          { error: "Enter a valid energy value." },
          { status: 400 }
        );
      }

      const maxEnergy = Number(currentState.max_energy ?? 100);

      const newEnergy = Math.max(
        0,
        Math.min(Math.round(value), maxEnergy)
      );

      const { error } = await supabase
        .from("player_game_states")
        .update({
          energy: newEnergy,
        })
        .eq("user_id", targetUserId);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      await supabase.from("admin_player_actions").insert({
        admin_user_id: admin.id,
        target_user_id: targetUserId,
        action: "energy",
        reason: body.reason?.trim() || null,
        metadata: {
          previousEnergy: currentState.energy ?? 0,
          newEnergy,
        },
      });

      return NextResponse.json({
        success: true,
        action: "energy",
        newEnergy,
      });
    }

    // -----------------------------------------------------
    // REPUTATION
    // -----------------------------------------------------

    if (action === "reputation") {
      const value = numberOrNull(body.value);

      if (value === null) {
        return NextResponse.json(
          { error: "Enter a valid reputation value." },
          { status: 400 }
        );
      }

      const newReputation = Math.round(value);

      const { error: stateUpdateError } = await supabase
        .from("player_game_states")
        .update({
          reputation: newReputation,
        })
        .eq("user_id", targetUserId);

      if (stateUpdateError) {
        return NextResponse.json(
          { error: stateUpdateError.message },
          { status: 500 }
        );
      }

      const { error: profileUpdateError } = await supabase
        .from("player_profiles")
        .update({
          reputation: newReputation,
        })
        .eq("id", targetUserId);

      if (profileUpdateError) {
        return NextResponse.json(
          { error: profileUpdateError.message },
          { status: 500 }
        );
      }

      await supabase.from("admin_player_actions").insert({
        admin_user_id: admin.id,
        target_user_id: targetUserId,
        action: "reputation",
        reason: body.reason?.trim() || null,
        metadata: {
          previousReputation: currentState.reputation ?? 0,
          newReputation,
        },
      });

      return NextResponse.json({
        success: true,
        action: "reputation",
        newReputation,
      });
    }

    // -----------------------------------------------------
    // EXPERIENCE
    // -----------------------------------------------------

    if (action === "experience") {
      const value = numberOrNull(body.value);

      if (value === null || value < 0) {
        return NextResponse.json(
          { error: "Enter a valid experience value." },
          { status: 400 }
        );
      }

      const newExperience = Math.round(value);

      const { error } = await supabase
        .from("player_profiles")
        .update({
          experience: newExperience,
        })
        .eq("id", targetUserId);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      await supabase.from("admin_player_actions").insert({
        admin_user_id: admin.id,
        target_user_id: targetUserId,
        action: "experience",
        reason: body.reason?.trim() || null,
        metadata: {
          previousExperience: profile.id
            ? "stored in player profile"
            : 0,
          newExperience,
        },
      });

      return NextResponse.json({
        success: true,
        action: "experience",
        newExperience,
      });
    }

    // -----------------------------------------------------
    // LOCATION
    // -----------------------------------------------------

    if (action === "location") {
      const locationId = body.locationId?.trim();

      if (!locationId) {
        return NextResponse.json(
          { error: "Location ID is required." },
          { status: 400 }
        );
      }

      const { error: stateUpdateError } = await supabase
        .from("player_game_states")
        .update({
          current_location_id: locationId,
        })
        .eq("user_id", targetUserId);

      if (stateUpdateError) {
        return NextResponse.json(
          { error: stateUpdateError.message },
          { status: 500 }
        );
      }

      const { error: profileUpdateError } = await supabase
        .from("player_profiles")
        .update({
          current_location_id: locationId,
        })
        .eq("id", targetUserId);

      if (profileUpdateError) {
        return NextResponse.json(
          { error: profileUpdateError.message },
          { status: 500 }
        );
      }

      await supabase.from("admin_player_actions").insert({
        admin_user_id: admin.id,
        target_user_id: targetUserId,
        action: "location",
        reason: body.reason?.trim() || null,
        metadata: {
          previousLocation:
            currentState.current_location_id ?? "garki",
          newLocation: locationId,
        },
      });

      return NextResponse.json({
        success: true,
        action: "location",
        locationId,
      });
    }

    // -----------------------------------------------------
    // RESET
    // -----------------------------------------------------

    if (action === "reset") {
      const { error } = await supabase
        .from("player_game_states")
        .update({
          cash: 10000,
          energy: 100,
          max_energy: 100,
          reputation: 0,
          current_job_id: null,
          job_experience: 0,
          current_location_id: "garki",
          is_frozen: false,
        })
        .eq("user_id", targetUserId);

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      const { error: profileResetError } = await supabase
        .from("player_profiles")
        .update({
          reputation: 0,
          current_location_id: "garki",
          experience: 0,
        })
        .eq("id", targetUserId);

      if (profileResetError) {
        return NextResponse.json(
          { error: profileResetError.message },
          { status: 500 }
        );
      }

      await supabase.from("admin_player_actions").insert({
        admin_user_id: admin.id,
        target_user_id: targetUserId,
        action: "reset",
        reason: body.reason?.trim() || null,
        metadata: {
          resetTo: {
            cash: 10000,
            energy: 100,
            reputation: 0,
            currentLocationId: "garki",
            isFrozen: false,
          },
        },
      });

      return NextResponse.json({
        success: true,
        action: "reset",
      });
    }

    return NextResponse.json(
      { error: "Unsupported action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin player control error:", error);

    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }
}
