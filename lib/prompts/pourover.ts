import { CoffeeInput } from "@/types";
import {
  normalizeRoast,
  grindAdjustment,
  tempForRoast,
  preferenceNote,
  JSON_SCHEMA,
} from "./utils";

export function buildPouroverPrompt(input: CoffeeInput): string {
  const roast = normalizeRoast(input.roastLevel);
  const temp = tempForRoast(input.roastLevel, input.process);
  const grindNote = grindAdjustment(input.roastLevel, input.process);
  const prefNote = preferenceNote(input.preference);
  const waterAmount = Math.round(input.dose * 16.5);
  const bloomWater = Math.round(input.dose * 2.5);

  const methodRanges: Record<string, string> = {
    V60: "500–750 micron",
    Kalita: "500–750 micron",
    Chemex: "700–1000 micron",
  };
  const micronRange = methodRanges[input.brewMethod] ?? "500–800 micron";

  const agitation =
    roast === "dark" || input.process === "natural" || input.process === "anaerobic"
      ? "minimal agitation — swirl only at bloom if needed, avoid stirring during pours"
      : roast === "light"
      ? "moderate agitation — gentle stir at bloom, one swirl mid-pour to ensure even extraction"
      : "light agitation — swirl at bloom, no stirring during pours";

  return `You are a specialty coffee expert. Generate a precise ${input.brewMethod} recipe based on the following coffee and user preferences.

COFFEE INFO:
- Name: ${input.coffeeName}
- Roaster: ${input.roaster}
- Origin: ${input.origin}
${input.variety ? `- Variety: ${input.variety}` : ""}
- Process: ${input.process}
- Roast level: ${input.roastLevel} (normalized: ${roast})
- Tasting notes: ${input.tastingNotes}

BREW PARAMETERS:
- Method: ${input.brewMethod}
- Dose: ${input.dose}g
- Target water: ~${waterAmount}g (ratio 1:16.5, adjust if preference demands)
- Bloom water: ~${bloomWater}g
- Grind range: ${micronRange}
- Grind note: ${grindNote}
- Water temp: ~${temp.c}°C / ${temp.f}°F
${input.grinder ? `- Grinder: ${input.grinder}` : ""}
${input.burrType && input.burrType !== "unknown" ? `- Burr type: ${input.burrType} (flat burrs: more clarity/separation; conical: more body/sweetness)` : ""}

USER PREFERENCE: ${input.preference}
Preference note: ${prefNote}

RECIPE PRINCIPLES (James Hoffmann / Lance Hedrick style):
- Bloom: 2–2.5x coffee dose, 30–45 seconds
- ${agitation}
- Pour in 2–4 stages after bloom
- Total time: 2:30–4:00 depending on grind and dose
- Give specific grind size in microns within the range
- All temperatures in both °C and °F
- Steps must be time-stamped

${JSON_SCHEMA}`;
}
