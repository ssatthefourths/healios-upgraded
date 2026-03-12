import { useState } from "react";
import StatusBar from "./StatusBar";
import Navigation from "./Navigation";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>
      
      <header 
        className={`w-full sticky top-0 z-50 transition-shadow duration-300 ${
          isScrolled ? 'shadow-sm' : ''
        }`}
      >
        {/* <StatusBar /> */}
        <Navigation onScrollChange={setIsScrolled} />
      </header>
    </>
  );
};

export default Header;
