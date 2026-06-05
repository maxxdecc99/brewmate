interface RecipeCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export default function RecipeCard({ label, value, sub }: RecipeCardProps) {
  return (
    <div className="bg-white border-2 border-stone-900 p-4 flex flex-col gap-1">
      <span className="text-xs font-bold uppercase tracking-widest text-stone-500">
        {label}
      </span>
      <span className="text-2xl font-black text-stone-900 leading-none">
        {value}
      </span>
      {sub && <span className="text-sm text-stone-500">{sub}</span>}
    </div>
  );
}
