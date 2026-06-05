import { CoffeeInput } from "@/types";
import {
  normalizeRoast,
  grindAdjustment,
  tempForRoast,
  preferenceNote,
  JSON_SCHEMA,
} from "./utils";

export function buildFrenchPressPrompt(input: CoffeeInput): string {
  const roast = normalizeRoast(input.roastLevel);
  const temp = tempForRoast(input.roastLevel, input.process);
  const grindNote = grindAdjustment(input.roastLevel, input.process);
  const prefNote = preferenceNote(input.preference);
  const waterAmount = Math.round(input.dose * 15);

  return `You are a specialty coffee expert. Generate a precise French Press recipe based on the following coffee and user preferences.

COFFEE INFO:
- Name: ${input.coffeeName}
- Roaster: ${input.roaster}
- Origin: ${input.origin}
${input.variety ? `- Variety: ${input.variety}` : ""}
- Process: ${input.process}
- Roast level: ${input.roastLevel} (normalized: ${roast})
- Tasting notes: ${input.tastingNotes}

BREW PARAMETERS:
- Method: French Press
- Dose: ${input.dose}g
- Water: ~${waterAmount}g (ratio ~1:15)
- Grind range: 900–1200 micron (coarse)
- Grind note: ${grindNote}
- Water temp: ~${temp.c}°C / ${temp.f}°F
${input.grinder ? `- Grinder: ${input.grinder}` : ""}
${input.burrType && input.burrType !== "unknown" ? `- Burr type: ${input.burrType}` : ""}

USER PREFERENCE: ${input.preference}
Preference note: ${prefNote}

FRENCH PRESS PRINCIPLES:
- Total steep: 4–5 minutes
- Add all water at once, minimal agitation
- Break crust at 4:00, skim foam/grounds, wait 1 more min for settling
- Press gently and slowly
- Pour immediately after pressing
- Steps must be clearly timed

${JSON_SCHEMA}`;
}
