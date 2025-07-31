import { Button } from "@/frontend/components/ui/button";
import { useTheme } from "@/frontend/lib/context/theme-context";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const getIcon = () => {
    return theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-9 px-0"
      onClick={cycleTheme}
      title={`Current theme: ${theme}. Click to cycle.`}
    >
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
