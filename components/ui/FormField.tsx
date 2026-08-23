export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-heading text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">
      {children}
    </label>
  );
}

const fieldClassName =
  "w-full border-0 border-b-2 border-ink bg-transparent px-0 py-2 text-espresso font-medium focus:outline-none focus:border-terracotta transition-colors placeholder:text-muted/60";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldClassName} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClassName} appearance-none`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClassName} resize-none`} />;
}
