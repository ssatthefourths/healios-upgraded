import { useCurrency, SUPPORTED_CURRENCIES, Currency } from "@/contexts/CurrencyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const CurrencySelector = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-sm font-light">
        <span>{currency.code}</span>
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-background border border-border shadow-lg z-[100] min-w-[160px]"
      >
        {SUPPORTED_CURRENCIES.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr)}
            className={`cursor-pointer ${currency.code === curr.code ? 'bg-muted' : ''}`}
          >
            <span className="w-8">{curr.symbol}</span>
            <span>{curr.code}</span>
            <span className="ml-auto text-muted-foreground text-xs">{curr.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySelector;
