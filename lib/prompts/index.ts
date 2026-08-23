import { CoffeeInput, BrewMethod } from "@/types";
import { buildPouroverPrompt } from "./pourover";
import { buildEspressoPrompt } from "./espresso";
import { buildAeropressPrompt } from "./aeropress";
import { buildFrenchPressPrompt } from "./frenchpress";

const POUROVER_METHODS: BrewMethod[] = ["V60", "Kalita", "Chemex"];

export function buildPrompt(input: CoffeeInput): string {
  if (POUROVER_METHODS.includes(input.brewMethod)) {
    return buildPouroverPrompt(input);
  }
  if (input.brewMethod === "Espresso") {
    return buildEspressoPrompt(input);
  }
  if (input.brewMethod === "AeroPress") {
    return buildAeropressPrompt(input);
  }
  if (input.brewMethod === "French Press") {
    return buildFrenchPressPrompt(input);
  }
  return buildPouroverPrompt(input);
}
