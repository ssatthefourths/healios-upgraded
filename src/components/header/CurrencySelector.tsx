import { useCurrency, SUPPORTED_CURRENCIES } from "@/contexts/CurrencyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import CurrencyFlag from "./CurrencyFlag";

const CurrencySelector = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 p-2 text-nav-foreground hover:text-nav-hover transition-colors duration-200 text-sm font-light">
        <CurrencyFlag code={currency.code} />
        <span>{currency.code}</span>
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-background border border-border shadow-lg z-[100] min-w-[200px]"
      >
        {SUPPORTED_CURRENCIES.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr)}
            className={`flex items-center gap-2 cursor-pointer ${currency.code === curr.code ? 'bg-muted' : ''}`}
          >
            <CurrencyFlag code={curr.code} />
            <span className="w-10">{curr.code}</span>
            <span className="w-6 text-muted-foreground">{curr.symbol}</span>
            <span className="ml-auto text-muted-foreground text-xs">{curr.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySelector;
