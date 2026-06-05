import { CoffeeInput } from "@/types";
import {
  normalizeRoast,
  grindAdjustment,
  tempForRoast,
  preferenceNote,
  ESPRESSO_JSON_SCHEMA,
} from "./utils";

export function buildEspressoPrompt(input: CoffeeInput): string {
  const roast = normalizeRoast(input.roastLevel);
  const temp = tempForRoast(input.roastLevel, input.process);
  const grindNote = grindAdjustment(input.roastLevel, input.process);
  const prefNote = preferenceNote(input.preference);

  // Starting ratios by roast
  const ratio = roast === "light" ? "1:2.5" : roast === "dark" ? "1:1.8" : "1:2";
  const yieldG =
    roast === "light"
      ? Math.round(input.dose * 2.5)
      : roast === "dark"
      ? Math.round(input.dose * 1.8)
      : Math.round(input.dose * 2);

  return `You are a specialty coffee expert. Generate a precise espresso recipe based on the following coffee and user preferences.

COFFEE INFO:
- Name: ${input.coffeeName}
- Roaster: ${input.roaster}
- Origin: ${input.origin}
${input.variety ? `- Variety: ${input.variety}` : ""}
- Process: ${input.process}
- Roast level: ${input.roastLevel} (normalized: ${roast})
- Tasting notes: ${input.tastingNotes}

BREW PARAMETERS:
- Method: Espresso
- Dose: ${input.dose}g (standard 18g, use given dose)
- Starting yield: ~${yieldG}g (ratio ~${ratio})
- Grind range: 200–350 micron
- Grind note: ${grindNote}
- Water temp: ~${temp.c}°C / ${temp.f}°F
- Pressure: 9 bar (standard; note if lower pressure recommended)
${input.grinder ? `- Grinder: ${input.grinder}` : ""}
${input.burrType && input.burrType !== "unknown" ? `- Burr type: ${input.burrType}` : ""}

USER PREFERENCE: ${input.preference}
Preference note: ${prefNote}

ESPRESSO PRINCIPLES:
- Shot time target: 25–30 sec (light roast may run 28–35s at longer ratio)
- Include pre-infusion recommendation (2–5 sec low pressure if possible)
- Dial-in tips must include: sour fix, bitter fix, weak fix
- Give precise grind micron value
- All temps in both °C and °F
- Steps: dose → distribute/tamp → pre-infuse → pull → stop

${ESPRESSO_JSON_SCHEMA}`;
}
