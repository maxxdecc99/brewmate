interface RecipeCardProps {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "terracotta" | "ink" | "surface";
}

const TONE_CLASSES: Record<Required<RecipeCardProps>["tone"], string> = {
  terracotta: "bg-terracotta text-white",
  ink: "bg-ink text-cream",
  surface: "bg-surface text-espresso",
};

const LABEL_CLASSES: Record<Required<RecipeCardProps>["tone"], string> = {
  terracotta: "text-white/70",
  ink: "text-cream/60",
  surface: "text-muted",
};

export default function RecipeCard({ label, value, sub, tone = "surface" }: RecipeCardProps) {
  return (
    <div className={`p-4 flex flex-col gap-1 ${TONE_CLASSES[tone]}`}>
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
