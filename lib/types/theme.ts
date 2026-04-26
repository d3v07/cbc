import { z } from "zod";

export const ThemeSchema = z.enum(["cute", "warm", "quiet", "noir", "gothic"]);
export type Theme = z.infer<typeof ThemeSchema>;

export const DEFAULT_THEME: Theme = "warm";
