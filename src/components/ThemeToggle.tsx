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
        className="p-2.5 rounded-lg bg-white/80 dark:bg-dark-600/80 border border-gray-200 dark:border-dark-500 shadow-sm hover:bg-gray-100 dark:hover:bg-dark-500 transition-colors backdrop-blur-sm"
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Moon size={20} className="text-gray-700" />
        ) : (
          <Sun size={20} className="text-amber-300" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-400 transition-colors flex items-center space-x-3 w-full text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <>
          <Moon size={20} className="text-gray-700" />
          <span className="hidden md:inline">Dark Mode</span>
        </>
      ) : (
        <>
          <Sun size={20} className="text-amber-300" />
          <span className="hidden md:inline text-white">Light Mode</span>
        </>
      )}
    </button>
  );
}
