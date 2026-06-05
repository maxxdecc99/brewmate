import { RoastLevel, Process, UserPreference } from "@/types";

export function normalizeRoast(roast: RoastLevel): "light" | "medium" | "dark" {
  if (roast === "filter roast") return "light";
  if (roast === "espresso roast") return "medium";
  if (roast === "light" || roast === "medium" || roast === "dark") return roast;
  return "medium";
}

export function isDecaf(process: Process): boolean {
  return process === "decaf";
}

export function grindAdjustment(
  roast: RoastLevel,
  process: Process
): string {
  const normalized = normalizeRoast(roast);
  const decaf = isDecaf(process);
  const notes: string[] = [];

  if (decaf) notes.push("slightly coarser than usual — decaf extracts faster");
  else if (normalized === "light") notes.push("slightly finer end of range");
  else if (normalized === "dark") notes.push("slightly coarser end of range");

  if (process === "natural" || process === "anaerobic")
    notes.push("lean coarser to avoid overextraction of fruity compounds");
  else if (process === "washed")
    notes.push("can lean finer for clarity and brightness");

  return notes.join("; ");
}

export function tempForRoast(
  roast: RoastLevel,
  process: Process
): { c: number; f: number } {
  const normalized = normalizeRoast(roast);
  const decaf = isDecaf(process);

  let c = 93;
  if (normalized === "light") c = 96;
  else if (normalized === "dark") c = 90;
  if (decaf) c = Math.min(c, 92);

  const f = Math.round(c * 9 / 5 + 32);
  return { c, f };
}

export function preferenceNote(pref: UserPreference): string {
  const map: Record<UserPreference, string> = {
    balanced: "aim for balanced extraction, no extreme adjustments",
    sweeter:
      "target sweetness: slightly lower temp, moderate agitation, consider shorter bloom",
    brighter:
      "target brightness/acidity: slightly higher temp, finer grind, more agitation",
    stronger:
      "stronger cup: reduce ratio slightly (closer to 1:14–1:15), ensure full extraction",
    "lower acidity":
      "reduce acidity: lower temp, coarser grind, less agitation, longer steep if applicable",
  };
  return map[pref];
}

export const JSON_SCHEMA = `Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:
{
  "coffeeName": "string",
  "brewMethod": "string",
  "dose": number,
  "waterAmount": number,
  "ratio": "string (e.g. 1:16.7)",
  "grindMicrons": number,
  "temperatureC": number,
  "temperatureF": number,
  "totalTime": "string (e.g. 3:30)",
  "steps": [{ "title": "string", "description": "string", "time": "string" }],
  "adjustmentTips": ["string"],
  "notes": "string"
}`;

export const ESPRESSO_JSON_SCHEMA = `Return ONLY valid JSON, no markdown, no explanation. Use this exact structure:
{
  "coffeeName": "string",
  "brewMethod": "Espresso",
  "dose": number,
  "yield": number,
  "waterAmount": number,
  "ratio": "string (e.g. 1:2)",
  "grindMicrons": number,
  "temperatureC": number,
  "temperatureF": number,
  "totalTime": "string (shot time, e.g. 0:28)",
  "pressure": "string (e.g. 9 bar)",
  "preInfusion": "string or null",
  "shotTime": "string (e.g. 25–30 sec)",
  "steps": [{ "title": "string", "description": "string", "time": "string" }],
  "adjustmentTips": ["string (include sour/bitter/weak dial-in tips)"],
  "notes": "string"
}`;
