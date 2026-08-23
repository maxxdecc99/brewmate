import { CoffeeInput } from "@/types";
import {
  normalizeRoast,
  grindAdjustment,
  tempForRoast,
  preferenceNote,
  JSON_SCHEMA,
} from "./utils";

export function buildAeropressPrompt(input: CoffeeInput): string {
  const roast = normalizeRoast(input.roastLevel);
  const temp = tempForRoast(input.roastLevel, input.process);
  const grindNote = grindAdjustment(input.roastLevel, input.process);
  const prefNote = preferenceNote(input.preference);
  const waterAmount = Math.round(input.dose * 14);

  return `You are a specialty coffee expert. Generate a precise AeroPress recipe based on the following coffee and user preferences.

COFFEE INFO:
- Name: ${input.coffeeName}
- Roaster: ${input.roaster}
- Origin: ${input.origin}
${input.variety ? `- Variety: ${input.variety}` : ""}
- Process: ${input.process}
- Roast level: ${input.roastLevel} (normalized: ${roast})
- Tasting notes: ${input.tastingNotes}

BREW PARAMETERS:
- Method: AeroPress
- Dose: ${input.dose}g
- Water: ~${waterAmount}g (ratio ~1:14)
- Grind range: 400–700 micron
- Grind note: ${grindNote}
- Water temp: ~${temp.c}°C / ${temp.f}°F
${input.grinder ? `- Grinder: ${input.grinder}` : ""}
${input.burrType && input.burrType !== "unknown" ? `- Burr type: ${input.burrType}` : ""}

USER PREFERENCE: ${input.preference}
Preference note: ${prefNote}

AEROPRESS PRINCIPLES:
- Keep it simple and reproducible
- Use inverted or standard method — choose what gives best result for this coffee
- Steep time: 1:00–2:30 total (shorter for finer/lighter, longer for coarser/darker)
- Stir once after adding water, press slowly (20–30 sec)
- No bypass water unless clearly improving the cup
- Steps must be clearly timed

${JSON_SCHEMA}`;
}
