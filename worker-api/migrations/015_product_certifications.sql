-- Generic certification-badge infrastructure.
--
-- Why it's generic: the immediate need is KSM-66® on Ashwagandha (v2 CSV
-- ticket #2 + #12-badge), but future certifications (Informed Sport, Vegan
-- Society, Non-GMO Project, etc.) should land as a row + asset drop, not
-- engineering work. Keep the schema minimal and additive.

CREATE TABLE IF NOT EXISTS certifications (
  key         TEXT PRIMARY KEY,     -- stable slug, e.g. 'ksm-66', 'informed-sport'
  name        TEXT NOT NULL,        -- display name, e.g. 'KSM-66® Ashwagandha'
  tagline     TEXT,                 -- short description, shown on hover/tooltip
  asset_url   TEXT,                 -- URL of the final PNG/SVG badge; NULL = render text fallback
  href        TEXT,                 -- optional external verification link
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_certifications (
  product_id  TEXT NOT NULL,
  cert_key    TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, cert_key),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (cert_key)   REFERENCES certifications(key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_certifications_product
  ON product_certifications(product_id, sort_order);

-- Seed: KSM-66 certification, asset_url intentionally NULL until Monique supplies
-- the transparent PNG/SVG. While NULL the PDP renders a text-badge fallback so
-- the rendering slot is live and testable immediately.
INSERT OR IGNORE INTO certifications (key, name, tagline, asset_url, href) VALUES
  ('ksm-66',
   'KSM-66® Ashwagandha',
   'The world''s most clinically-studied Ashwagandha extract',
   NULL,
   'https://ksm66ashwagandhaa.com/');

-- Link Ashwagandha product to the KSM-66 cert.
INSERT OR IGNORE INTO product_certifications (product_id, cert_key, sort_order) VALUES
  ('ashwagandha-gummies', 'ksm-66', 0);
