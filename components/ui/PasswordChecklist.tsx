"use client";

import { PASSWORD_REQUIREMENTS } from "@/lib/passwordValidation";

export default function PasswordChecklist({ password }: { password: string }) {
  if (!password) return null;

  return (
    <ul className="flex flex-col gap-1.5 pt-1">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(password);
        return (
          <li
            key={req.id}
            className={`flex items-center gap-2 text-xs font-medium transition-colors ${
              met ? "text-terracotta" : "text-muted"
            }`}
          >
            <span className="w-3 shrink-0 font-black">{met ? "✓" : "·"}</span>
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}
