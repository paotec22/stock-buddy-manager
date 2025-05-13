
import { Moon, Sun, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "@/components/ui/use-toast";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleRefresh = () => {
    // Create a custom event that components can listen to for refreshing data
    const refreshEvent = new CustomEvent('app:refresh-data');
    window.dispatchEvent(refreshEvent);
    
    toast({
      title: "Refreshing content...",
      description: "Updating data without reloading the page."
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleRefresh}
        title="Refresh content"
      >
        <RefreshCw className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Refresh content</span>
      </Button>
    </div>
  );
}
