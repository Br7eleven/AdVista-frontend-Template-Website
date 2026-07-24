import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { createPortal } from 'react-dom';

const countries = [
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Russia', code: '+7', flag: '🇷🇺' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Turkey', code: '+90', flag: '🇹🇷' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' },
  { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Egypt', code: '+20', flag: '🇪🇬' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'Israel', code: '+972', flag: '🇮🇱' },
].sort((a, b) => a.name.localeCompare(b.name));

interface CountryCodeSelectProps {
  selectedCode: string;
  onSelect: (code: string) => void;
  disabled?: boolean;
}

export default function CountryCodeSelect({ selectedCode, onSelect, disabled = false }: CountryCodeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtered, setFiltered] = useState(countries);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const selectedCountry = countries.find(c => c.code === selectedCode) ?? countries[0];

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Filter on search
  useEffect(() => {
    setFiltered(
      countries.filter(
        c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.includes(searchQuery)
      )
    );
  }, [searchQuery]);

  const open = () => {
    if (disabled) return;
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 256),
      });
    }
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const select = (code: string) => {
    onSelect(code);
    close();
  };

  const dropdown = isOpen ? createPortal(
    <div
      className="z-[9999] bg-white dark:bg-dark-600 border border-gray-200 dark:border-dark-500 rounded-xl shadow-2xl text-gray-900 dark:text-light overflow-hidden"
      style={dropdownStyle}
    >
      {/* Search */}
      <div className="p-2 border-b border-gray-100 dark:border-dark-500">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-dark-700 rounded-lg">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search country or code…"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-light placeholder:text-gray-400"
            autoFocus
          />
        </div>
      </div>
      {/* List */}
      <div className="max-h-52 overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => select(c.code)}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-dark-500 text-left transition-colors"
            >
              <span className="text-base leading-none">{c.flag}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-light truncate">{c.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{c.code}</p>
              </div>
            </button>
          ))
        ) : (
          <p className="px-4 py-4 text-sm text-gray-400 text-center">No countries found</p>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={isOpen ? close : open}
        disabled={disabled}
        className={`flex items-center gap-1.5 h-[42px] px-3 rounded-xl border transition-colors ${
          disabled
            ? 'bg-gray-100 dark:bg-dark-700 cursor-not-allowed opacity-60'
            : 'bg-white dark:bg-dark-700 hover:bg-gray-50 dark:hover:bg-dark-500 cursor-pointer'
        } border-gray-200 dark:border-dark-400 text-gray-900 dark:text-light`}
        style={{ minWidth: 64 }}
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <span className="text-sm font-semibold">{selectedCountry.code}</span>
        <ChevronDown
          size={13}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {dropdown}
    </div>
  );
}