import { cookies } from "next/headers";
import { de } from "./de";
import { en } from "./en";
import type { Translations } from "./types";

export type Locale = "de" | "en";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get("locale")?.value === "en" ? "en" : "de";
}

export async function getT(): Promise<Translations> {
  const locale = await getLocale();
  return locale === "en" ? en : de;
}
