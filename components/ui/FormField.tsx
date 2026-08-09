export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block font-heading text-xs font-bold uppercase tracking-widest text-muted mb-1">
      {children}
    </label>
  );
}

const fieldClassName =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink font-medium focus:outline-none focus:border-terracotta transition-colors placeholder:text-muted/60";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldClassName} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClassName} appearance-none`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${fieldClassName} resize-none`} />;
}
