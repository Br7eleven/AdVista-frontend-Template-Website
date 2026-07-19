import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type ThemeToggleProps = {
  compact?: boolean;
};

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="glass-chip h-10 w-10 text-gray-800 dark:text-amber-200"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? <Moon size={18} strokeWidth={2.25} /> : <Sun size={18} strokeWidth={2.25} />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-3 rounded-2xl hover:bg-royal-50 dark:hover:bg-pin-element transition-colors flex items-center space-x-3 w-full text-gray-700 dark:text-pin-muted hover:text-royal-700 dark:hover:text-white"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <>
          <Moon size={20} className="text-gray-700" />
          <span className="hidden md:inline font-medium">Dark Mode</span>
        </>
      ) : (
        <>
          <Sun size={20} className="text-amber-300" />
          <span className="hidden md:inline text-white font-medium">Light Mode</span>
        </>
      )}
    </button>
  );
}
