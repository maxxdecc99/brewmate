interface RecipeCardProps {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "terracotta" | "olive" | "gold" | "surface";
}

const TONE_CLASSES: Record<Required<RecipeCardProps>["tone"], string> = {
  terracotta: "bg-terracotta text-white",
  olive: "bg-olive text-white",
  gold: "bg-gold text-espresso",
  surface: "bg-surface border border-line text-espresso",
};

const LABEL_CLASSES: Record<Required<RecipeCardProps>["tone"], string> = {
  terracotta: "text-white/75",
  olive: "text-white/75",
  gold: "text-espresso/60",
  surface: "text-muted",
};

export default function RecipeCard({ label, value, sub, tone = "surface" }: RecipeCardProps) {
  return (
    <div className={`rounded-xl p-4 flex flex-col gap-1 ${TONE_CLASSES[tone]}`}>
      <span className={`font-heading text-[10px] font-bold uppercase tracking-widest ${LABEL_CLASSES[tone]}`}>
        {label}
      </span>
      <span className="font-heading text-2xl font-bold leading-none">
        {value}
      </span>
      {sub && <span className={`text-sm ${LABEL_CLASSES[tone]}`}>{sub}</span>}
    </div>
  );
}
