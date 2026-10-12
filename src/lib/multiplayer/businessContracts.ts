"use client";

import { createClient } from "@/lib/supabase/client";

export type PlayerBusinessContractStatus =
  | "open"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rejected";

export interface PlayerBusinessContract {
  id: string;
  clientId: string;
  workerId: string | null;
  businessOwnerId: string;
  businessId: string;
  missionId: string | null;
  title: string;
  description: string | null;
  locationId: string | null;
  reward: number;
  reputationReward: number;
  experienceReward: number;
  status: PlayerBusinessContractStatus;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
}

function getSupabase() {
  return createClient();
}

function mapContract(
  row: Record<string, unknown>
): PlayerBusinessContract {
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    workerId: row.worker_id
      ? String(row.worker_id)
      : null,
    businessOwnerId: String(row.business_owner_id),
    businessId: String(row.business_id),
    missionId: row.mission_id
      ? String(row.mission_id)
      : null,
    title: String(row.title),
    description:
      row.description !== null &&
      row.description !== undefined
        ? String(row.description)
        : null,
    locationId:
      row.location_id !== null &&
      row.location_id !== undefined
        ? String(row.location_id)
        : null,
    reward: Number(row.reward ?? 0),
    reputationReward: Number(
      row.reputation_reward ?? 0
    ),
    experienceReward: Number(
      row.experience_reward ?? 0
    ),
    status:
      row.status as PlayerBusinessContractStatus,
    createdAt: String(row.created_at),
    acceptedAt: row.accepted_at
      ? String(row.accepted_at)
      : null,
    completedAt: row.completed_at
      ? String(row.completed_at)
      : null,
  };
}

export async function getOpenBusinessContracts(): Promise<
  PlayerBusinessContract[]
> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("player_business_contracts")
    .select("*")
    .eq("status", "open")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapContract);
}

export async function getMyBusinessContracts(): Promise<
  PlayerBusinessContract[]
> {
  const supabase = getSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data, error } = await supabase
    .from("player_business_contracts")
    .select("*")
    .or(
      `client_id.eq.${user.id},worker_id.eq.${user.id},business_owner_id.eq.${user.id}`
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapContract);
}

export async function createPlayerBusinessContract(
  businessOwnerId: string,
  businessId: string,
  title: string,
  description: string,
  reward: number,
  reputationReward: number,
  experienceReward: number,
  locationId?: string,
  missionId?: string
): Promise<PlayerBusinessContract> {
  const supabase = getSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  if (user.id === businessOwnerId) {
    throw new Error(
      "You cannot hire yourself for a business contract."
    );
  }

  if (reward <= 0) {
    throw new Error(
      "Contract reward must be greater than zero."
    );
  }

  const { data, error } = await supabase
    .from("player_business_contracts")
    .insert({
      client_id: user.id,
      business_owner_id: businessOwnerId,
      business_id: businessId,
      mission_id: missionId ?? null,
      title: title.trim(),
      description: description.trim(),
      location_id: locationId ?? null,
      reward: Math.round(reward),
      reputation_reward: Math.max(
        0,
        Math.round(reputationReward)
      ),
      experience_reward: Math.max(
        0,
        Math.round(experienceReward)
      ),
      status: "open",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapContract(data);
}

export async function acceptBusinessContract(
  contractId: string
): Promise<PlayerBusinessContract> {
  const supabase = getSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data, error } = await supabase
    .from("player_business_contracts")
    .update({
      worker_id: user.id,
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", contractId)
    .eq("status", "open")
    .is("worker_id", null)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapContract(data);
}

export async function startBusinessContract(
  contractId: string
): Promise<PlayerBusinessContract> {
  const supabase = getSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data, error } = await supabase
    .from("player_business_contracts")
    .update({
      status: "in_progress",
    })
    .eq("id", contractId)
    .eq("worker_id", user.id)
    .eq("status", "accepted")
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapContract(data);
}

export async function completeBusinessContract(
  contractId: string
): Promise<{
  success: boolean;
  contractId: string;
  workerId: string;
  reward: number;
  workerBalance: number;
}> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc(
    "complete_player_business_contract",
    {
      p_contract_id: contractId,
    }
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "The contract payment could not be completed."
    );
  }

  return {
    success: Boolean(data.success),
    contractId: String(data.contract_id),
    workerId: String(data.worker_id),
    reward: Number(data.reward),
    workerBalance: Number(data.worker_balance),
  };
}

export async function cancelBusinessContract(
  contractId: string
): Promise<PlayerBusinessContract> {
  const supabase = getSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const { data, error } = await supabase
    .from("player_business_contracts")
    .update({
      status: "cancelled",
    })
    .eq("id", contractId)
    .or(
      `client_id.eq.${user.id},business_owner_id.eq.${user.id}`
    )
    .in("status", ["open", "accepted"])
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapContract(data);
}

export async function subscribeToBusinessContracts(
  onContractChange: (
    contract: PlayerBusinessContract
  ) => void
) {
  const supabase = getSupabase();

  const channel = supabase
    .channel(
      `business-contracts-${Date.now()}`
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "player_business_contracts",
      },
      (payload) => {
        if (payload.new) {
          onContractChange(
            mapContract(
              payload.new as Record<string, unknown>
            )
          );
        }
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
