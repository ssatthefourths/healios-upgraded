import type { ComponentType } from "react";

export interface IconBundleItem {
  key: string;
  label: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
}

interface Props {
  items: IconBundleItem[];
  label?: string;
}

/**
 * A grouped row of icon links that never splits across wraps — the whole
 * flex container breaks to a new line as a unit. Each link opens in a new
 * tab with rel="noopener noreferrer" and an aria-label for accessibility.
 * Renders nothing when `items` is empty so an empty bundle adds no visual
 * weight to the footer.
 */
export const IconBundle = ({ items, label }: Props) => {
  if (items.length === 0) return null;
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-4 text-muted-foreground"
    >
      {items.map(({ key, label: linkLabel, href, Icon }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={linkLabel}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border hover:text-foreground hover:border-foreground transition-colors"
        >
          <Icon className="w-4 h-4" />
        </a>
      ))}
    </div>
  );
};

export default IconBundle;
