"use client";

import { PanelLeft, ChevronDown, Sun, Moon } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { languages } from "@/lib/languages";

interface HeaderProps {
  title?: string;
  onToggleSidebar?: () => void;
}

export function CBAMHeader({
  title = "Getting Started",
  onToggleSidebar,
}: HeaderProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const currentLanguage =
    languages.find((l) => l.code === locale) ?? languages[0];

  function handleLanguageChange(code: string) {
    // Replace the locale segment in the current path
    const newPath = pathname.replace(`/${locale}`, `/${code}`);
    router.push(newPath);
  }

  return (
    <header className="bg-background flex h-14 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="text-muted-foreground hover:text-foreground"
        >
          <PanelLeft className="size-5" />
        </Button>
        <span className="text-sm font-medium">{title}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground relative"
        >
          <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <span className="text-base">{currentLanguage!.flag}</span>
              <span>{currentLanguage!.name}</span>
              <ChevronDown className="size-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {languages.map((language) => (
              <DropdownMenuItem
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className="gap-2"
              >
                <span className="text-base">{language.flag}</span>
                <span>{language.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
