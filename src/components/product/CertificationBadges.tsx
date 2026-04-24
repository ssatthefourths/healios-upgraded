import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";

interface Certification {
  key: string;
  name: string;
  tagline: string | null;
  asset_url: string | null;
  href: string | null;
}

interface CertificationBadgesProps {
  productId: string;
}

const WORKER_URL = import.meta.env.VITE_CF_WORKER_URL as string | undefined;

async function fetchCertifications(productId: string): Promise<Certification[]> {
  if (!WORKER_URL) return [];
  const res = await fetch(
    `${WORKER_URL}/public/product/${encodeURIComponent(productId)}/certifications`
  );
  if (!res.ok) return [];
  const body = (await res.json()) as { certifications?: Certification[] };
  return body.certifications ?? [];
}

/**
 * Renders certification badges for a product (KSM-66, Informed Sport, etc.).
 * Falls back to a text-only chip when `asset_url` is null — lets us ship the
 * rendering slot immediately while final PNG/SVG assets are still pending.
 *
 * Renders nothing if the product has no certifications.
 */
const CertificationBadges = ({ productId }: CertificationBadgesProps) => {
  const { data: certs } = useQuery({
    queryKey: ["certifications", productId],
    queryFn: () => fetchCertifications(productId),
    staleTime: 60 * 60 * 1000, // 1 hour — matches the Worker's s-maxage
    enabled: !!productId,
  });

  if (!certs || certs.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3" role="list" aria-label="Certifications">
      {certs.map((cert) => {
        const content = cert.asset_url ? (
          <img
            src={cert.asset_url}
            alt={cert.name}
            className="h-10 w-auto object-contain"
            loading="lazy"
          />
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground">
            <Award className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            <span>{cert.name}</span>
          </span>
        );

        if (cert.href) {
          return (
            <a
              key={cert.key}
              href={cert.href}
              target="_blank"
              rel="noopener noreferrer"
              title={cert.tagline ?? cert.name}
              aria-label={`${cert.name} — ${cert.tagline ?? "certification"}`}
              className="inline-flex items-center transition-opacity hover:opacity-80"
              role="listitem"
            >
              {content}
            </a>
          );
        }

        return (
          <div
            key={cert.key}
            title={cert.tagline ?? cert.name}
            aria-label={`${cert.name} — ${cert.tagline ?? "certification"}`}
            role="listitem"
          >
            {content}
          </div>
        );
      })}
    </div>
  );
};

export default CertificationBadges;
