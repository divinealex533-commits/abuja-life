// Abuja Life — referral rewards. Server only.

import type { SupabaseClient } from "@supabase/supabase-js";

import { applyPlayerDelta } from "@/lib/vip/server";

/** Most friends one player can be rewarded for in 30 days (anti-abuse). */
const MONTHLY_CAP = 30;

/**
 * Called after a player finishes a career shift. If they were invited
 * and haven't triggered the reward yet, pay the inviter and the new
 * player once. Returns the new player's bonus (0 if none).
 */
export async function payReferralIfDue(admin: SupabaseClient, userId: string): Promise<number> {
  try {
    const { data: referral } = await admin
      .from("referrals")
      .select("referrer_id, status")
      .eq("referred_id", userId)
      .maybeSingle();

    if (!referral || referral.status !== "pending") return 0;

    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { count } = await admin
      .from("referrals")
      .select("referred_id", { count: "exact", head: true })
      .eq("referrer_id", referral.referrer_id)
      .eq("status", "rewarded")
      .gte("rewarded_at", since);

    const { data: settings } = await admin
      .from("admin_game_settings")
      .select("referral_reward_referrer, referral_reward_new_player")
      .eq("id", 1)
      .maybeSingle();

    const capped = (count ?? 0) >= MONTHLY_CAP;
    const referrerReward = capped ? 0 : Number(settings?.referral_reward_referrer ?? 5000);
    const newPlayerReward = Number(settings?.referral_reward_new_player ?? 2000);

    // Mark rewarded first; only one request can win this update.
    const { data: claimed } = await admin
      .from("referrals")
      .update({
        status: "rewarded",
        rewarded_at: new Date().toISOString(),
        referrer_reward: referrerReward,
        referred_reward: newPlayerReward,
      })
      .eq("referred_id", userId)
      .eq("status", "pending")
      .select("referred_id");

    if (!claimed || claimed.length === 0) return 0;

    if (referrerReward > 0) {
      await applyPlayerDelta(admin, referral.referrer_id, { cash: referrerReward }).catch(() => undefined);
      await admin.from("notifications").insert({
        player_id: referral.referrer_id,
        type: "system",
        title: "Your friend started working! 🎉",
        message: `You earned ₦${referrerReward.toLocaleString("en-NG")} for inviting them.`,
        action_url: "/invite",
        actor_id: userId,
      });
    }

    if (newPlayerReward > 0) {
      await applyPlayerDelta(admin, userId, { cash: newPlayerReward }).catch(() => undefined);
    }

    return newPlayerReward;
  } catch (error) {
    console.error("Referral reward error:", error);
    return 0;
  }
}
