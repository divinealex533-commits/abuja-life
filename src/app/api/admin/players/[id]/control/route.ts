import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/access";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const ALLOWED_ACTIONS = new Set([
  "freeze",
  "unfreeze",
  "cash",
  "energy",
  "reputation",
  "experience",
  "location",
  "reset",
]);

function numberValue(value: unknown) {
  const number =
    typeof value === "number" ? value : Number(value);

  return Number.isFinite(number) ? number : null;
}

function getReason(value: unknown) {
  if (typeof value !== "string") return null;

  const reason = value.trim();

  return reason ? reason.slice(0, 1000) : null;
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const admin = await requireAdmin();

    const { id: playerId } = await context.params;

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    const action =
      typeof body?.action === "string"
        ? body.action.trim()
        : "";

    const reason = getReason(body?.reason);

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: "Unsupported admin action." },
        { status: 400 }
      );
    }

    /*
     * Use the service-role client here because this route has
     * already passed requireAdmin().
     *
     * This also means admins configured through ADMIN_USER_IDS
     * work correctly even if their JWT does not contain the
     * app_metadata admin role.
     */
    const supabase = createAdminSupabaseClient();

    // ---------------------------------------------------------
    // ADMIN GAME SETTINGS
    // ---------------------------------------------------------

    const { data: settings, error: settingsError } =
      await supabase
        .from("admin_game_settings")
        .select(
          "default_player_cash, max_player_energy"
        )
        .eq("id", 1)
        .single();

    if (settingsError || !settings) {
      console.error(
        "Admin game settings lookup error:",
        settingsError
      );

      return NextResponse.json(
        {
          error:
            "Game settings could not be loaded. Player action was not applied.",
        },
        { status: 503 }
      );
    }

    const defaultPlayerCash = Number(
      settings.default_player_cash
    );

    const configuredMaxEnergy = Number(
      settings.max_player_energy
    );

    if (
      !Number.isFinite(defaultPlayerCash) ||
      defaultPlayerCash < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Admin default player cash setting is invalid.",
        },
        { status: 503 }
      );
    }

    if (
      !Number.isInteger(configuredMaxEnergy) ||
      configuredMaxEnergy <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Admin maximum player energy setting is invalid.",
        },
        { status: 503 }
      );
    }

    // ---------------------------------------------------------
    // CURRENT GAME STATE
    // ---------------------------------------------------------

    const { data: current, error: currentError } =
      await supabase
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
        .eq("user_id", playerId)
        .maybeSingle();

    if (currentError) {
      return NextResponse.json(
        { error: currentError.message },
        { status: 500 }
      );
    }

    if (!current) {
      return NextResponse.json(
        {
          error:
            "Player game state was not found.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // CURRENT PROFILE
    // ---------------------------------------------------------

    const { data: profile, error: profileError } =
      await supabase
        .from("player_profiles")
        .select(
          "id, experience, level, reputation"
        )
        .eq("id", playerId)
        .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Player profile was not found.",
        },
        { status: 404 }
      );
    }

    const before = {
      cash: Number(current.cash),
      energy: Number(current.energy),
      maxEnergy: Number(current.max_energy),
      reputation: Number(
        profile.reputation ??
          current.reputation
      ),
      experience: Number(
        profile.experience ?? 0
      ),
      level: Number(
        profile.level ?? 1
      ),
      currentJobId:
        current.current_job_id,
      jobExperience: Number(
        current.job_experience
      ),
      currentLocationId:
        current.current_location_id,
      isFrozen:
        current.is_frozen === true,
    };

    const gameUpdates: Record<
      string,
      unknown
    > = {};

    const profileUpdates: Record<
      string,
      unknown
    > = {};

    let amount: number | null = null;

    // ---------------------------------------------------------
    // ACTIONS
    // ---------------------------------------------------------

    switch (action) {
      case "freeze":
        if (before.isFrozen) {
          return NextResponse.json(
            {
              error:
                "Player is already frozen.",
            },
            { status: 400 }
          );
        }

        gameUpdates.is_frozen = true;
        break;

      case "unfreeze":
        if (!before.isFrozen) {
          return NextResponse.json(
            {
              error:
                "Player is not currently frozen.",
            },
            { status: 400 }
          );
        }

        gameUpdates.is_frozen = false;
        break;

      case "cash": {
        amount = numberValue(
          body?.amount
        );

        if (
          amount === null ||
          amount === 0
        ) {
          return NextResponse.json(
            {
              error:
                "Cash adjustment must be a non-zero number.",
            },
            { status: 400 }
          );
        }

        /*
         * Keep money precision sane.
         */
        amount =
          Math.round(amount * 100) / 100;

        const nextCash =
          before.cash + amount;

        if (nextCash < 0) {
          return NextResponse.json(
            {
              error:
                "Cash cannot become negative.",
            },
            { status: 400 }
          );
        }

        gameUpdates.cash = nextCash;
        break;
      }

      case "energy": {
        const value = numberValue(
          body?.value
        );

        if (
          value === null ||
          !Number.isInteger(value)
        ) {
          return NextResponse.json(
            {
              error:
                "Energy must be a whole number.",
            },
            { status: 400 }
          );
        }

        if (
          value < 0 ||
          value > configuredMaxEnergy
        ) {
          return NextResponse.json(
            {
              error:
                `Energy must be between 0 and ${configuredMaxEnergy}.`,
            },
            { status: 400 }
          );
        }

        /*
         * Keep the player's max energy synchronized
         * with the current Admin setting.
         */
        gameUpdates.max_energy =
          configuredMaxEnergy;

        gameUpdates.energy = value;

        break;
      }

      case "reputation": {
        const value = numberValue(
          body?.value
        );

        if (
          value === null ||
          !Number.isInteger(value)
        ) {
          return NextResponse.json(
            {
              error:
                "Reputation must be a whole number.",
            },
            { status: 400 }
          );
        }

        profileUpdates.reputation =
          value;

        gameUpdates.reputation =
          value;

        break;
      }

      case "experience": {
        const value = numberValue(
          body?.value
        );

        if (
          value === null ||
          !Number.isInteger(value) ||
          value < 0
        ) {
          return NextResponse.json(
            {
              error:
                "XP must be a non-negative whole number.",
            },
            { status: 400 }
          );
        }

        profileUpdates.experience =
          value;

        break;
      }

      case "location": {
        if (
          typeof body?.locationId !==
            "string" ||
          !body.locationId.trim()
        ) {
          return NextResponse.json(
            {
              error:
                "A location is required.",
            },
            { status: 400 }
          );
        }

        gameUpdates.current_location_id =
          body.locationId
            .trim()
            .slice(0, 100);

        break;
      }

      case "reset":
        /*
         * IMPORTANT:
         * Reset now uses the values configured
         * inside Admin → Game Settings.
         *
         * No more hardcoded ₦10,000.
         */
        gameUpdates.cash =
          defaultPlayerCash;

        gameUpdates.max_energy =
          configuredMaxEnergy;

        gameUpdates.energy =
          configuredMaxEnergy;

        gameUpdates.reputation = 0;

        gameUpdates.current_job_id =
          null;

        gameUpdates.job_experience = 0;

        gameUpdates.current_location_id =
          "garki";

        gameUpdates.is_frozen = false;

        profileUpdates.experience = 0;

        profileUpdates.reputation = 0;

        break;
    }

    // ---------------------------------------------------------
    // UPDATE GAME STATE
    // ---------------------------------------------------------

    if (
      Object.keys(gameUpdates).length > 0
    ) {
      const { error } =
        await supabase
          .from("player_game_states")
          .update(gameUpdates)
          .eq("user_id", playerId);

      if (error) {
        console.error(
          "Admin game-state update error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Unable to update player game state.",
            details: error.message,
          },
          { status: 500 }
        );
      }
    }

    // ---------------------------------------------------------
    // UPDATE PROFILE
    // ---------------------------------------------------------

    if (
      Object.keys(profileUpdates).length > 0
    ) {
      const { error } =
        await supabase
          .from("player_profiles")
          .update(profileUpdates)
          .eq("id", playerId);

      if (error) {
        console.error(
          "Admin profile update error:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Unable to update player profile.",
            details: error.message,
          },
          { status: 500 }
        );
      }
    }

    // ---------------------------------------------------------
    // GET FINAL STATE
    // ---------------------------------------------------------

    const {
      data: finalState,
      error: finalError,
    } = await supabase
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
        is_frozen,
        updated_at
      `
      )
      .eq("user_id", playerId)
      .single();

    if (finalError) {
      console.error(
        "Final player state lookup error:",
        finalError
      );

      return NextResponse.json(
        {
          error:
            "Player was updated, but final state could not be confirmed.",
        },
        { status: 500 }
      );
    }

    const {
      data: finalProfile,
      error: finalProfileError,
    } = await supabase
      .from("player_profiles")
      .select(
        "experience, level, reputation"
      )
      .eq("id", playerId)
      .single();

    if (finalProfileError) {
      console.error(
        "Final player profile lookup error:",
        finalProfileError
      );
    }

    const after = {
      cash: Number(
        finalState.cash
      ),
      energy: Number(
        finalState.energy
      ),
      maxEnergy: Number(
        finalState.max_energy
      ),
      reputation: Number(
        finalProfile?.reputation ??
          finalState.reputation
      ),
      experience: Number(
        finalProfile?.experience ?? 0
      ),
      level: Number(
        finalProfile?.level ?? 1
      ),
      currentJobId:
        finalState.current_job_id,
      jobExperience: Number(
        finalState.job_experience
      ),
      currentLocationId:
        finalState.current_location_id,
      isFrozen:
        finalState.is_frozen === true,
    };

    // ---------------------------------------------------------
    // AUDIT LOG
    // ---------------------------------------------------------

    const { error: auditError } =
      await supabase
        .from("admin_player_actions")
        .insert({
          player_id: playerId,
          admin_id: admin.id,
          action,
          reason,
          amount,
          before_value: before,
          after_value: after,
          metadata: {
            source:
              "admin_player_control",
            defaultPlayerCash:
              defaultPlayerCash,
            configuredMaxEnergy:
              configuredMaxEnergy,
          },
        });

    if (auditError) {
      /*
       * Do not undo the player action merely because
       * the audit insert failed, but make it very visible
       * to the server logs and response.
       */
      console.error(
        "Player action audit error:",
        auditError
      );
    }

    return NextResponse.json({
      success: true,
      action,
      auditLogged: !auditError,
      player: {
        ...finalState,
        experience:
          after.experience,
        level:
          after.level,
      },
    });
  } catch (error) {
    console.error(
      "Admin player control error:",
      error
    );

    if (
      error instanceof Error &&
      error.message ===
        "ADMIN_ACCESS_REQUIRED"
    ) {
      return NextResponse.json(
        {
          error:
            "Admin access required.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Unable to complete admin player action.",
      },
      { status: 500 }
    );
  }
}
