import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Add-to-cart toasts anchor below the cart icon on desktop (top-right)
 * and fall back to top-center on mobile where the header collapses —
 * per ticket 10.
 */
const useResponsivePosition = (): ToasterProps["position"] => {
  const getPos = (): ToasterProps["position"] =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
      ? "top-right"
      : "top-center";
  const [position, setPosition] = useState<ToasterProps["position"]>(getPos);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = () => setPosition(getPos());
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return position;
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const position = useResponsivePosition();

  return (
    <Sonner
      position={position}
      offset={16}
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
