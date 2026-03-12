import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, Search } from 'lucide-react';

interface CountryCode {
  name: string;
  code: string;       // ISO 2-letter
  dialCode: string;   // e.g. "+44"
  flag: string;       // emoji flag
  trunkPrefix?: string; // leading digit to strip from local number (e.g. "0")
}

// Priority countries shown at the top
const PRIORITY_COUNTRIES: CountryCode[] = [
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', trunkPrefix: '0' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦', trunkPrefix: '0' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Cyprus', code: 'CY', dialCode: '+357', flag: '🇨🇾' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
];

// Full alphabetical list of countries
const ALL_COUNTRIES: CountryCode[] = [
  { name: 'Afghanistan', code: 'AF', dialCode: '+93', flag: '🇦🇫', trunkPrefix: '0' },
  { name: 'Albania', code: 'AL', dialCode: '+355', flag: '🇦🇱', trunkPrefix: '0' },
  { name: 'Algeria', code: 'DZ', dialCode: '+213', flag: '🇩🇿', trunkPrefix: '0' },
  { name: 'Andorra', code: 'AD', dialCode: '+376', flag: '🇦🇩' },
  { name: 'Angola', code: 'AO', dialCode: '+244', flag: '🇦🇴' },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷', trunkPrefix: '0' },
  { name: 'Armenia', code: 'AM', dialCode: '+374', flag: '🇦🇲', trunkPrefix: '0' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', trunkPrefix: '0' },
  { name: 'Austria', code: 'AT', dialCode: '+43', flag: '🇦🇹', trunkPrefix: '0' },
  { name: 'Azerbaijan', code: 'AZ', dialCode: '+994', flag: '🇦🇿', trunkPrefix: '0' },
  { name: 'Bahamas', code: 'BS', dialCode: '+1', flag: '🇧🇸' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880', flag: '🇧🇩', trunkPrefix: '0' },
  { name: 'Barbados', code: 'BB', dialCode: '+1', flag: '🇧🇧' },
  { name: 'Belarus', code: 'BY', dialCode: '+375', flag: '🇧🇾', trunkPrefix: '80' },
  { name: 'Belgium', code: 'BE', dialCode: '+32', flag: '🇧🇪', trunkPrefix: '0' },
  { name: 'Belize', code: 'BZ', dialCode: '+501', flag: '🇧🇿' },
  { name: 'Benin', code: 'BJ', dialCode: '+229', flag: '🇧🇯' },
  { name: 'Bhutan', code: 'BT', dialCode: '+975', flag: '🇧🇹' },
  { name: 'Bolivia', code: 'BO', dialCode: '+591', flag: '🇧🇴', trunkPrefix: '0' },
  { name: 'Bosnia and Herzegovina', code: 'BA', dialCode: '+387', flag: '🇧🇦', trunkPrefix: '0' },
  { name: 'Botswana', code: 'BW', dialCode: '+267', flag: '🇧🇼' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷', trunkPrefix: '0' },
  { name: 'Brunei', code: 'BN', dialCode: '+673', flag: '🇧🇳' },
  { name: 'Bulgaria', code: 'BG', dialCode: '+359', flag: '🇧🇬', trunkPrefix: '0' },
  { name: 'Burkina Faso', code: 'BF', dialCode: '+226', flag: '🇧🇫' },
  { name: 'Burundi', code: 'BI', dialCode: '+257', flag: '🇧🇮' },
  { name: 'Cambodia', code: 'KH', dialCode: '+855', flag: '🇰🇭', trunkPrefix: '0' },
  { name: 'Cameroon', code: 'CM', dialCode: '+237', flag: '🇨🇲' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Cape Verde', code: 'CV', dialCode: '+238', flag: '🇨🇻' },
  { name: 'Central African Republic', code: 'CF', dialCode: '+236', flag: '🇨🇫' },
  { name: 'Chad', code: 'TD', dialCode: '+235', flag: '🇹🇩' },
  { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳', trunkPrefix: '0' },
  { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴' },
  { name: 'Comoros', code: 'KM', dialCode: '+269', flag: '🇰🇲' },
  { name: 'Congo (DRC)', code: 'CD', dialCode: '+243', flag: '🇨🇩', trunkPrefix: '0' },
  { name: 'Congo (Republic)', code: 'CG', dialCode: '+242', flag: '🇨🇬' },
  { name: 'Costa Rica', code: 'CR', dialCode: '+506', flag: '🇨🇷' },
  { name: 'Croatia', code: 'HR', dialCode: '+385', flag: '🇭🇷', trunkPrefix: '0' },
  { name: 'Cuba', code: 'CU', dialCode: '+53', flag: '🇨🇺', trunkPrefix: '0' },
  { name: 'Cyprus', code: 'CY', dialCode: '+357', flag: '🇨🇾' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420', flag: '🇨🇿' },
  { name: 'Denmark', code: 'DK', dialCode: '+45', flag: '🇩🇰' },
  { name: 'Djibouti', code: 'DJ', dialCode: '+253', flag: '🇩🇯' },
  { name: 'Dominican Republic', code: 'DO', dialCode: '+1', flag: '🇩🇴' },
  { name: 'Ecuador', code: 'EC', dialCode: '+593', flag: '🇪🇨', trunkPrefix: '0' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬', trunkPrefix: '0' },
  { name: 'El Salvador', code: 'SV', dialCode: '+503', flag: '🇸🇻' },
  { name: 'Equatorial Guinea', code: 'GQ', dialCode: '+240', flag: '🇬🇶' },
  { name: 'Eritrea', code: 'ER', dialCode: '+291', flag: '🇪🇷', trunkPrefix: '0' },
  { name: 'Estonia', code: 'EE', dialCode: '+372', flag: '🇪🇪' },
  { name: 'Eswatini', code: 'SZ', dialCode: '+268', flag: '🇸🇿' },
  { name: 'Ethiopia', code: 'ET', dialCode: '+251', flag: '🇪🇹', trunkPrefix: '0' },
  { name: 'Fiji', code: 'FJ', dialCode: '+679', flag: '🇫🇯' },
  { name: 'Finland', code: 'FI', dialCode: '+358', flag: '🇫🇮', trunkPrefix: '0' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷', trunkPrefix: '0' },
  { name: 'Gabon', code: 'GA', dialCode: '+241', flag: '🇬🇦' },
  { name: 'Gambia', code: 'GM', dialCode: '+220', flag: '🇬🇲' },
  { name: 'Georgia', code: 'GE', dialCode: '+995', flag: '🇬🇪', trunkPrefix: '0' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪', trunkPrefix: '0' },
  { name: 'Ghana', code: 'GH', dialCode: '+233', flag: '🇬🇭', trunkPrefix: '0' },
  { name: 'Greece', code: 'GR', dialCode: '+30', flag: '🇬🇷' },
  { name: 'Guatemala', code: 'GT', dialCode: '+502', flag: '🇬🇹' },
  { name: 'Guinea', code: 'GN', dialCode: '+224', flag: '🇬🇳' },
  { name: 'Guyana', code: 'GY', dialCode: '+592', flag: '🇬🇾' },
  { name: 'Haiti', code: 'HT', dialCode: '+509', flag: '🇭🇹' },
  { name: 'Honduras', code: 'HN', dialCode: '+504', flag: '🇭🇳' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852', flag: '🇭🇰' },
  { name: 'Hungary', code: 'HU', dialCode: '+36', flag: '🇭🇺', trunkPrefix: '06' },
  { name: 'Iceland', code: 'IS', dialCode: '+354', flag: '🇮🇸' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', trunkPrefix: '0' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', trunkPrefix: '0' },
  { name: 'Iran', code: 'IR', dialCode: '+98', flag: '🇮🇷', trunkPrefix: '0' },
  { name: 'Iraq', code: 'IQ', dialCode: '+964', flag: '🇮🇶', trunkPrefix: '0' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪', trunkPrefix: '0' },
  { name: 'Israel', code: 'IL', dialCode: '+972', flag: '🇮🇱', trunkPrefix: '0' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Ivory Coast', code: 'CI', dialCode: '+225', flag: '🇨🇮' },
  { name: 'Jamaica', code: 'JM', dialCode: '+1', flag: '🇯🇲' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵', trunkPrefix: '0' },
  { name: 'Jordan', code: 'JO', dialCode: '+962', flag: '🇯🇴', trunkPrefix: '0' },
  { name: 'Kazakhstan', code: 'KZ', dialCode: '+7', flag: '🇰🇿', trunkPrefix: '8' },
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪', trunkPrefix: '0' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Kyrgyzstan', code: 'KG', dialCode: '+996', flag: '🇰🇬', trunkPrefix: '0' },
  { name: 'Laos', code: 'LA', dialCode: '+856', flag: '🇱🇦', trunkPrefix: '0' },
  { name: 'Latvia', code: 'LV', dialCode: '+371', flag: '🇱🇻' },
  { name: 'Lebanon', code: 'LB', dialCode: '+961', flag: '🇱🇧', trunkPrefix: '0' },
  { name: 'Lesotho', code: 'LS', dialCode: '+266', flag: '🇱🇸' },
  { name: 'Liberia', code: 'LR', dialCode: '+231', flag: '🇱🇷', trunkPrefix: '0' },
  { name: 'Libya', code: 'LY', dialCode: '+218', flag: '🇱🇾', trunkPrefix: '0' },
  { name: 'Liechtenstein', code: 'LI', dialCode: '+423', flag: '🇱🇮' },
  { name: 'Lithuania', code: 'LT', dialCode: '+370', flag: '🇱🇹', trunkPrefix: '8' },
  { name: 'Luxembourg', code: 'LU', dialCode: '+352', flag: '🇱🇺' },
  { name: 'Macau', code: 'MO', dialCode: '+853', flag: '🇲🇴' },
  { name: 'Madagascar', code: 'MG', dialCode: '+261', flag: '🇲🇬', trunkPrefix: '0' },
  { name: 'Malawi', code: 'MW', dialCode: '+265', flag: '🇲🇼' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', trunkPrefix: '0' },
  { name: 'Maldives', code: 'MV', dialCode: '+960', flag: '🇲🇻' },
  { name: 'Mali', code: 'ML', dialCode: '+223', flag: '🇲🇱' },
  { name: 'Malta', code: 'MT', dialCode: '+356', flag: '🇲🇹' },
  { name: 'Mauritania', code: 'MR', dialCode: '+222', flag: '🇲🇷' },
  { name: 'Mauritius', code: 'MU', dialCode: '+230', flag: '🇲🇺' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'Moldova', code: 'MD', dialCode: '+373', flag: '🇲🇩', trunkPrefix: '0' },
  { name: 'Monaco', code: 'MC', dialCode: '+377', flag: '🇲🇨' },
  { name: 'Mongolia', code: 'MN', dialCode: '+976', flag: '🇲🇳', trunkPrefix: '0' },
  { name: 'Montenegro', code: 'ME', dialCode: '+382', flag: '🇲🇪', trunkPrefix: '0' },
  { name: 'Morocco', code: 'MA', dialCode: '+212', flag: '🇲🇦', trunkPrefix: '0' },
  { name: 'Mozambique', code: 'MZ', dialCode: '+258', flag: '🇲🇿' },
  { name: 'Myanmar', code: 'MM', dialCode: '+95', flag: '🇲🇲', trunkPrefix: '0' },
  { name: 'Namibia', code: 'NA', dialCode: '+264', flag: '🇳🇦', trunkPrefix: '0' },
  { name: 'Nepal', code: 'NP', dialCode: '+977', flag: '🇳🇵', trunkPrefix: '0' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱', trunkPrefix: '0' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿', trunkPrefix: '0' },
  { name: 'Nicaragua', code: 'NI', dialCode: '+505', flag: '🇳🇮' },
  { name: 'Niger', code: 'NE', dialCode: '+227', flag: '🇳🇪' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬', trunkPrefix: '0' },
  { name: 'North Macedonia', code: 'MK', dialCode: '+389', flag: '🇲🇰', trunkPrefix: '0' },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰', trunkPrefix: '0' },
  { name: 'Palestine', code: 'PS', dialCode: '+970', flag: '🇵🇸', trunkPrefix: '0' },
  { name: 'Panama', code: 'PA', dialCode: '+507', flag: '🇵🇦' },
  { name: 'Papua New Guinea', code: 'PG', dialCode: '+675', flag: '🇵🇬' },
  { name: 'Paraguay', code: 'PY', dialCode: '+595', flag: '🇵🇾', trunkPrefix: '0' },
  { name: 'Peru', code: 'PE', dialCode: '+51', flag: '🇵🇪', trunkPrefix: '0' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', trunkPrefix: '0' },
  { name: 'Poland', code: 'PL', dialCode: '+48', flag: '🇵🇱' },
  { name: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Romania', code: 'RO', dialCode: '+40', flag: '🇷🇴', trunkPrefix: '0' },
  { name: 'Russia', code: 'RU', dialCode: '+7', flag: '🇷🇺', trunkPrefix: '8' },
  { name: 'Rwanda', code: 'RW', dialCode: '+250', flag: '🇷🇼', trunkPrefix: '0' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦', trunkPrefix: '0' },
  { name: 'Senegal', code: 'SN', dialCode: '+221', flag: '🇸🇳' },
  { name: 'Serbia', code: 'RS', dialCode: '+381', flag: '🇷🇸', trunkPrefix: '0' },
  { name: 'Sierra Leone', code: 'SL', dialCode: '+232', flag: '🇸🇱', trunkPrefix: '0' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Slovakia', code: 'SK', dialCode: '+421', flag: '🇸🇰', trunkPrefix: '0' },
  { name: 'Slovenia', code: 'SI', dialCode: '+386', flag: '🇸🇮', trunkPrefix: '0' },
  { name: 'Somalia', code: 'SO', dialCode: '+252', flag: '🇸🇴' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦', trunkPrefix: '0' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷', trunkPrefix: '0' },
  { name: 'South Sudan', code: 'SS', dialCode: '+211', flag: '🇸🇸', trunkPrefix: '0' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰', trunkPrefix: '0' },
  { name: 'Sudan', code: 'SD', dialCode: '+249', flag: '🇸🇩', trunkPrefix: '0' },
  { name: 'Suriname', code: 'SR', dialCode: '+597', flag: '🇸🇷' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪', trunkPrefix: '0' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭', trunkPrefix: '0' },
  { name: 'Syria', code: 'SY', dialCode: '+963', flag: '🇸🇾', trunkPrefix: '0' },
  { name: 'Taiwan', code: 'TW', dialCode: '+886', flag: '🇹🇼', trunkPrefix: '0' },
  { name: 'Tajikistan', code: 'TJ', dialCode: '+992', flag: '🇹🇯', trunkPrefix: '8' },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255', flag: '🇹🇿', trunkPrefix: '0' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭', trunkPrefix: '0' },
  { name: 'Togo', code: 'TG', dialCode: '+228', flag: '🇹🇬' },
  { name: 'Trinidad and Tobago', code: 'TT', dialCode: '+1', flag: '🇹🇹' },
  { name: 'Tunisia', code: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷', trunkPrefix: '0' },
  { name: 'Turkmenistan', code: 'TM', dialCode: '+993', flag: '🇹🇲', trunkPrefix: '8' },
  { name: 'Uganda', code: 'UG', dialCode: '+256', flag: '🇺🇬', trunkPrefix: '0' },
  { name: 'Ukraine', code: 'UA', dialCode: '+380', flag: '🇺🇦', trunkPrefix: '0' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪', trunkPrefix: '0' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', trunkPrefix: '0' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'Uruguay', code: 'UY', dialCode: '+598', flag: '🇺🇾', trunkPrefix: '0' },
  { name: 'Uzbekistan', code: 'UZ', dialCode: '+998', flag: '🇺🇿', trunkPrefix: '0' },
  { name: 'Venezuela', code: 'VE', dialCode: '+58', flag: '🇻🇪', trunkPrefix: '0' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳', trunkPrefix: '0' },
  { name: 'Yemen', code: 'YE', dialCode: '+967', flag: '🇾🇪', trunkPrefix: '0' },
  { name: 'Zambia', code: 'ZM', dialCode: '+260', flag: '🇿🇲', trunkPrefix: '0' },
  { name: 'Zimbabwe', code: 'ZW', dialCode: '+263', flag: '🇿🇼', trunkPrefix: '0' },
];

interface PhoneInputProps {
  value: string; // stored as "+44 7911123456" (dial code + space + local)
  onChange: (fullNumber: string) => void;
  onBlur?: () => void;
  error?: string | null;
  label?: string;
}

/**
 * Parses a stored phone string like "+27 821234567" into dial code and local number.
 */
const parsePhoneValue = (value: string): { countryCode: string; localNumber: string } => {
  if (!value) return { countryCode: 'GB', localNumber: '' };

  // Try to match a dial code at the start
  const allCountries = [...PRIORITY_COUNTRIES, ...ALL_COUNTRIES];
  // Sort by dial code length desc so longer codes match first
  const sorted = [...allCountries].sort((a, b) => b.dialCode.length - a.dialCode.length);

  for (const country of sorted) {
    if (value.startsWith(country.dialCode)) {
      const rest = value.slice(country.dialCode.length).trim();
      return { countryCode: country.code, localNumber: rest };
    }
  }

  // Fallback: return full value as local number with UK default
  return { countryCode: 'GB', localNumber: value.replace(/^\+/, '') };
};

const findCountry = (code: string): CountryCode => {
  return ALL_COUNTRIES.find(c => c.code === code) ||
    PRIORITY_COUNTRIES.find(c => c.code === code) ||
    PRIORITY_COUNTRIES[0];
};

const PhoneInput = ({ value, onChange, onBlur, error, label = 'Phone Number' }: PhoneInputProps) => {
  const parsed = parsePhoneValue(value);
  const [selectedCountryCode, setSelectedCountryCode] = useState(parsed.countryCode);
  const [localNumber, setLocalNumber] = useState(parsed.localNumber);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedCountry = findCountry(selectedCountryCode);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [dropdownOpen]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm) return ALL_COUNTRIES;
    const term = searchTerm.toLowerCase();
    return ALL_COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.dialCode.includes(term) ||
      c.code.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const stripTrunkPrefix = (input: string, country: CountryCode): string => {
    if (!country.trunkPrefix || !input) return input;
    if (input.startsWith(country.trunkPrefix)) {
      return input.slice(country.trunkPrefix.length);
    }
    return input;
  };

  const handleLocalNumberChange = (rawInput: string) => {
    // Only allow digits
    const digitsOnly = rawInput.replace(/[^0-9]/g, '');
    // Auto-strip trunk prefix
    const cleaned = stripTrunkPrefix(digitsOnly, selectedCountry);
    setLocalNumber(cleaned);
    // Emit full number
    if (cleaned) {
      onChange(`${selectedCountry.dialCode} ${cleaned}`);
    } else {
      onChange('');
    }
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountryCode(country.code);
    setDropdownOpen(false);
    setSearchTerm('');
    // Re-strip trunk prefix for new country
    const cleaned = stripTrunkPrefix(localNumber, country);
    setLocalNumber(cleaned);
    if (cleaned) {
      onChange(`${country.dialCode} ${cleaned}`);
    } else {
      onChange('');
    }
  };

  return (
    <div>
      {label && <Label className="text-sm mb-1.5 block">{label}</Label>}
      <div className="flex gap-2">
        {/* Country Code Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-1.5 h-10 px-3 border rounded-md bg-background text-sm min-w-[100px] hover:bg-accent/5 transition-colors min-h-[44px] ${
              error ? 'border-destructive' : 'border-input'
            }`}
            aria-label="Select country code"
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="text-foreground font-medium">{selectedCountry.dialCode}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 top-full left-0 mt-1 w-72 max-h-80 bg-background border border-border rounded-md shadow-lg overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search countries..."
                    className="w-full pl-8 pr-3 py-2 text-sm bg-transparent border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-60">
                {/* Priority countries */}
                {!searchTerm && (
                  <>
                    {PRIORITY_COUNTRIES.map((country) => (
                      <button
                        key={`priority-${country.code}`}
                        type="button"
                        onClick={() => handleCountrySelect(country)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent/10 transition-colors text-left min-h-[44px] ${
                          selectedCountryCode === country.code ? 'bg-accent/10 font-medium' : ''
                        }`}
                      >
                        <span className="text-base leading-none">{country.flag}</span>
                        <span className="flex-1 text-foreground">{country.name}</span>
                        <span className="text-muted-foreground text-xs">{country.dialCode}</span>
                      </button>
                    ))}
                    <div className="border-t border-border my-1" />
                  </>
                )}

                {/* All countries (filtered) */}
                {filteredCountries.map((country) => (
                  <button
                    key={`all-${country.code}`}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent/10 transition-colors text-left min-h-[44px] ${
                      selectedCountryCode === country.code ? 'bg-accent/10 font-medium' : ''
                    }`}
                  >
                    <span className="text-base leading-none">{country.flag}</span>
                    <span className="flex-1 text-foreground">{country.name}</span>
                    <span className="text-muted-foreground text-xs">{country.dialCode}</span>
                  </button>
                ))}

                {filteredCountries.length === 0 && (
                  <p className="px-3 py-4 text-sm text-muted-foreground text-center">No countries found</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Number Input */}
        <Input
          type="tel"
          inputMode="numeric"
          value={localNumber}
          onChange={(e) => handleLocalNumberChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Mobile number"
          className={`flex-1 ${error ? 'border-destructive' : ''}`}
          name="phone"
          aria-label="Phone number without country code"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive mt-1.5 flex items-center gap-1.5">
          <span className="inline-block h-3.5 w-3.5">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
