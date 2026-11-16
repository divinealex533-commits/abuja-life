import { VIP_TIERS, type VipTier } from "@/lib/vip/catalog";

export default function VipBadge({
  tier,
  size = "sm",
}: {
  tier: VipTier | null | undefined;
  size?: "xs" | "sm" | "md";
}) {
  if (!tier) return null;

  const info = VIP_TIERS[tier];

  const sizing =
    size === "xs"
      ? "px-1.5 py-0.5 text-[8px]"
      : size === "md"
        ? "px-3 py-1.5 text-xs"
        : "px-2 py-1 text-[10px]";

  return (
    <span
      title={info.name}
      className={`inline-flex items-center gap-1 rounded-full border ${info.border} bg-black/30 font-black uppercase tracking-wider ${info.color} ${sizing}`}
    >
      <span>{info.emoji}</span>
      {size !== "xs" && <span>{tier}</span>}
    </span>
  );
}
