const BRAND_BLACK = "#0a0a0a";
const BRAND_CREAM = "#f7f2ec";
const BRAND_MUTED = "#6b6b6b";

const logo = `
   ██   ██ ███████  █████  ██      ██  ██████  ███████
   ██   ██ ██      ██   ██ ██      ██ ██    ██ ██
   ███████ █████   ███████ ██      ██ ██    ██ ███████
   ██   ██ ██      ██   ██ ██      ██ ██    ██      ██
   ██   ██ ███████ ██   ██ ███████ ██  ██████  ███████
`;

export const runConsoleEasterEgg = () => {
  if (!import.meta.env.PROD) return;
  if (typeof window === "undefined" || typeof window.console === "undefined") return;

  try {
    console.log(
      `%c${logo}`,
      `color: ${BRAND_BLACK}; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; line-height: 1.1;`
    );
    console.log(
      "%cwellness from the ground up",
      `color: ${BRAND_MUTED}; font: 300 12px/1.4 ui-sans-serif, system-ui, -apple-system;`
    );
    console.log(
      "%c  We see you, curious one.  ",
      `color: ${BRAND_BLACK}; background: ${BRAND_CREAM}; font: 500 13px ui-sans-serif, system-ui; padding: 6px 10px; border-radius: 6px;`
    );
    console.log(
      "%cKeep that curiosity alive — it's how good things get built.\nIf you love premium product work, say hi: hello@thehealios.com",
      `color: ${BRAND_MUTED}; font: 300 12px/1.6 ui-sans-serif, system-ui;`
    );
  } catch {
    // Consoles that don't support %c (or were tampered with) — stay silent.
  }
};
