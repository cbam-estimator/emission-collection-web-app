import { routing } from "@/i18n/routing";

// Maps locale code to the primary country code for the flag emoji
const localeToCountry: Record<string, string> = {
  en: "GB",
  de: "DE",
  fr: "FR",
  tr: "TR",
  pl: "PL",
  es: "ES",
};

function countryCodeToFlag(countryCode: string): string {
  return [...countryCode.toUpperCase()]
    .map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
    .join("");
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const languages: Language[] = routing.locales.map((locale) => {
  const displayNames = new Intl.DisplayNames([locale], { type: "language" });
  const name = displayNames.of(locale) ?? locale;
  const countryCode = localeToCountry[locale] ?? locale.toUpperCase();
  return {
    code: locale,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    flag: countryCodeToFlag(countryCode),
  };
});
