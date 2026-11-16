import { getCosmetic } from "@/lib/cosmetics/catalog";

/** A player's name with their Style shop colour and title. */
export function StyledName({
  name,
  nameStyle,
  title,
  className = "",
}: {
  name: string;
  nameStyle?: string | null;
  title?: string | null;
  className?: string;
}) {
  const style = getCosmetic(nameStyle);
  const titleItem = getCosmetic(title);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className={style?.className ?? ""}>{name}</span>
      {titleItem?.label && (
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-200">
          {titleItem.label}
        </span>
      )}
    </span>
  );
}

/** An avatar emoji with the player's Style shop frame. */
export function FramedAvatar({
  avatar,
  frame,
  size = "md",
}: {
  avatar: string;
  frame?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const frameItem = getCosmetic(frame);
  const sizing = size === "sm" ? "h-8 w-8 text-base" : size === "lg" ? "h-20 w-20 text-4xl" : "h-11 w-11 text-xl";

  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white/10 ${sizing} ${frameItem?.className ?? ""}`}>
      {avatar}
    </span>
  );
}
