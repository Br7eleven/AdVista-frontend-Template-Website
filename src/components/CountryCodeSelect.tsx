import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';

// Country data with codes and flags
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

const CountryCodeSelect: React.FC<CountryCodeSelectProps> = ({ 
  selectedCode, 
  onSelect,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCountries, setFilteredCountries] = useState(countries);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the selected country based on the code
  const selectedCountry = countries.find(country => country.code === selectedCode) || countries[0];

  useEffect(() => {
    // Filter countries based on search query
    const filtered = countries.filter(country => 
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      country.code.includes(searchQuery)
    );
    setFilteredCountries(filtered);
  }, [searchQuery]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectCountry = (country: typeof countries[0]) => {
    onSelect(country.code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        className={`flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2.5 h-[42px] border rounded-lg transition whitespace-nowrap ${
          disabled
            ? 'bg-gray-100 dark:bg-dark-500 cursor-not-allowed opacity-70'
            : 'bg-white dark:bg-dark-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-500'
        } border-gray-200 dark:border-dark-500 text-gray-900 dark:text-light`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <span className="text-sm font-medium">{selectedCountry.code}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-64 max-w-[min(16rem,calc(100vw-2rem))] bg-white dark:bg-dark-600 border border-gray-200 dark:border-dark-500 rounded-lg shadow-lg text-gray-900 dark:text-light">
          <div className="p-2 border-b border-gray-200 dark:border-dark-500">
            <div className="flex items-center space-x-2 px-2 py-1 bg-gray-100 dark:bg-dark-700 rounded">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code"
                className="w-full min-w-0 bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-light placeholder:text-gray-400"
                autoFocus
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => (
                <button
                  key={index}
                  type="button"
                  className="flex items-center space-x-3 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-dark-500 text-left"
                  onClick={() => handleSelectCountry(country)}
                >
                  <span className="text-lg">{country.flag}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-light truncate">{country.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{country.code}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelect;
