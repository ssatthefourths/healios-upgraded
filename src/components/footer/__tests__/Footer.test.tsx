/**
 * Feature: Site footer — social and trust icon bundles
 *
 *   Background:
 *     Given site_config holds 5 keys: social.facebook, social.instagram,
 *       social.tiktok, trust.google_business, trust.trustpilot
 *     And empty values mean "hide that icon"
 *
 *   Scenario: Only Instagram URL configured
 *     Given social.instagram = "https://www.instagram.com/thehealios_/"
 *     And the other four keys are empty strings
 *     When the Footer mounts
 *     Then a single anchor with aria-label "Instagram" is rendered in the footer
 *     And no Facebook, TikTok, Google Business, or Trustpilot anchors appear
 *     And the Instagram link opens in a new tab with rel="noopener noreferrer"
 *
 *   Scenario: All bundles configured
 *     Given all five site_config keys hold valid https URLs
 *     When the Footer mounts
 *     Then five anchors are rendered, in the order FB, IG, TikTok, Google, Trustpilot
 *
 *   Scenario: All bundles empty
 *     Given all five site_config keys are empty strings
 *     When the Footer mounts
 *     Then no social/trust icon anchor appears in the footer
 *
 * Verifies SharePoint Issue tracker tickets 36, 37 and the Google/Trustpilot
 * bundle item — all flagged by Monique on 2026-04-29 ("not showing on the
 * footer yet"). The bug was that Footer.tsx imported IconBundle and built
 * `socialItems`/`trustItems` arrays but never rendered them in JSX.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const mockConfig = vi.hoisted(() => ({ value: {} as Record<string, string> }));

vi.mock("@/hooks/useSiteConfig", () => ({
  useSiteConfig: () => ({
    config: mockConfig.value,
    loading: false,
    error: null,
  }),
}));

import Footer from "../Footer";

const renderFooter = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  cleanup();
  mockConfig.value = {};
});

describe("Footer — social/trust icon bundles (Tickets 36/37)", () => {
  it("renders the Instagram link when only IG URL is configured", () => {
    mockConfig.value = {
      "social.facebook": "",
      "social.instagram": "https://www.instagram.com/thehealios_/",
      "social.tiktok": "",
      "trust.google_business": "",
      "trust.trustpilot": "",
    };
    renderFooter();
    const link = screen.getByRole("link", { name: /instagram/i });
    expect(link).toHaveAttribute("href", "https://www.instagram.com/thehealios_/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel") ?? "").toContain("noopener");
  });

  it("does NOT render Facebook / TikTok / Google / Trustpilot icons when their URLs are empty", () => {
    mockConfig.value = {
      "social.facebook": "",
      "social.instagram": "https://www.instagram.com/thehealios_/",
      "social.tiktok": "",
      "trust.google_business": "",
      "trust.trustpilot": "",
    };
    renderFooter();
    expect(screen.queryByRole("link", { name: /^facebook$/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /^tiktok$/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /google business/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /trustpilot/i })).toBeNull();
  });

  it("renders all five icons when all URLs are configured", () => {
    mockConfig.value = {
      "social.facebook": "https://www.facebook.com/thehealios",
      "social.instagram": "https://www.instagram.com/thehealios_/",
      "social.tiktok": "https://www.tiktok.com/@thehealios",
      "trust.google_business": "https://www.google.com/maps/place/healios",
      "trust.trustpilot": "https://www.trustpilot.com/review/thehealios.com",
    };
    renderFooter();
    expect(screen.getByRole("link", { name: /^facebook$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^instagram$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^tiktok$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /google business/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /trustpilot/i })).toBeInTheDocument();
  });

  it("renders no social/trust anchors when all URLs are empty", () => {
    mockConfig.value = {
      "social.facebook": "",
      "social.instagram": "",
      "social.tiktok": "",
      "trust.google_business": "",
      "trust.trustpilot": "",
    };
    renderFooter();
    expect(screen.queryByRole("link", { name: /^facebook$/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /^instagram$/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /^tiktok$/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /google business/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /trustpilot/i })).toBeNull();
  });
});
