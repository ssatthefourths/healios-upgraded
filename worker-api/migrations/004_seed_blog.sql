-- Migration 004: Seed Blog Categories and Posts
-- Run each statement INDIVIDUALLY in the Cloudflare D1 dashboard console.
-- Statement 1: Wellness Tips category
INSERT INTO blog_categories (id, name, slug, sort_order) VALUES ('cat-wellness', 'Wellness Tips', 'wellness-tips', 1);

-- Statement 2: Supplements Guide category
INSERT INTO blog_categories (id, name, slug, sort_order) VALUES ('cat-supplements', 'Supplements Guide', 'supplements-guide', 2);

-- Statement 3: Beauty & Skin category
INSERT INTO blog_categories (id, name, slug, sort_order) VALUES ('cat-beauty', 'Beauty & Skin', 'beauty-skin', 3);

-- Statement 4: Sleep & Recovery category
INSERT INTO blog_categories (id, name, slug, sort_order) VALUES ('cat-sleep', 'Sleep & Recovery', 'sleep-recovery', 4);

-- Statement 5: Gut Health category
INSERT INTO blog_categories (id, name, slug, sort_order) VALUES ('cat-gut', 'Gut Health', 'gut-health', 5);

-- Statement 6: Post 1 — 5 Daily Habits for a Healthier You
INSERT INTO blog_posts (id, slug, title, excerpt, content, featured_image, status, category_id, seo_title, meta_description, reading_time_minutes, published_at) VALUES (
  'post-habits',
  'daily-wellness-habits',
  '5 Daily Habits for a Healthier You',
  'Small, consistent actions compound into remarkable results over time. These five evidence-backed habits can transform your wellbeing without overhauling your entire lifestyle. Start with one and build from there.',
  '<p>Building lasting wellness doesn''t require a dramatic overhaul. Research consistently shows that small, daily habits compounded over months create the most sustainable health improvements. Here are five habits worth adopting today.</p><h2>1. Hydrate Before You Caffeinate</h2><p>Your body loses water overnight through breathing and perspiration. Before reaching for coffee, drink 500 ml of water. This simple act kickstarts your metabolism, supports kidney function, and improves morning cognitive clarity. Add a slice of lemon for a gentle alkalising effect.</p><h2>2. Move Within the First Hour</h2><p>A 10–20 minute walk, stretch, or light workout within the first hour of waking sets your circadian rhythm, elevates mood through endorphin release, and improves insulin sensitivity for the rest of the day. You don''t need a gym — a brisk walk around the block counts.</p><h2>3. Eat a Protein-Forward Breakfast</h2><p>Protein at breakfast stabilises blood sugar, reduces mid-morning cravings, and supports muscle maintenance. Aim for at least 20–30 g of protein — eggs, Greek yoghurt, a quality protein shake, or our collagen powder stirred into porridge are all excellent choices.</p><h2>4. Take Your Daily Supplements Consistently</h2><p>Supplements are most effective when taken at the same time each day, ideally with food. Set a phone reminder. Whether it''s Vitamin D3 for immune and bone support or Ashwagandha to manage daily stress, consistency is what delivers results over weeks and months.</p><h2>5. Wind Down Intentionally</h2><p>The quality of your sleep determines how well you recover and perform the next day. Begin dimming lights and reducing screen exposure 60 minutes before bed. A magnesium supplement taken in the evening supports muscle relaxation and deeper sleep stages. Treat your pre-sleep routine with the same intention you give your morning one.</p><p>Start with just one of these habits this week. Consistency beats perfection every time.</p>',
  '/products/ashwagandha-gummies.png',
  'published',
  'cat-wellness',
  '5 Daily Wellness Habits | Healios',
  'Five evidence-backed daily habits to improve your energy, sleep, and overall wellbeing — without overhauling your entire lifestyle.',
  5,
  '2026-01-15 08:00:00'
);

-- Statement 7: Post 2 — Collagen Guide
INSERT INTO blog_posts (id, slug, title, excerpt, content, featured_image, status, category_id, seo_title, meta_description, reading_time_minutes, published_at) VALUES (
  'post-collagen',
  'collagen-guide',
  'The Complete Guide to Collagen Supplements',
  'Collagen is the most abundant protein in your body — yet production declines by roughly 1% per year after age 25. Understanding what collagen does, which type to take, and how to maximise absorption can make a significant difference to your skin, joints, and overall vitality.',
  '<p>Collagen accounts for about 30% of all the protein in your body. It provides the structural framework for skin, tendons, ligaments, cartilage, and bones. From your late twenties, your body produces progressively less of it — a process accelerated by sun exposure, smoking, excess sugar, and chronic stress.</p><h2>What Collagen Does</h2><p>Collagen fibres act like scaffolding. In skin, they maintain firmness and elasticity. In joints, they cushion and lubricate. In the gut lining, they support integrity and barrier function. As levels decline, these tissues become less resilient — visible as fine lines, joint stiffness, and slower recovery.</p><h2>Types of Collagen</h2><p><strong>Type I</strong> — The most abundant. Found in skin, hair, nails, tendons, and bones. Most beauty-focused collagen products use Type I, often sourced from bovine hide or marine fish skin.</p><p><strong>Type II</strong> — Primarily found in cartilage. Relevant for joint health and mobility.</p><p><strong>Type III</strong> — Found alongside Type I in skin and blood vessels. Often included in multi-collagen blends.</p><h2>Hydrolysed Collagen Peptides</h2><p>Raw collagen is poorly absorbed. Hydrolysed collagen (also called collagen peptides) has been broken into shorter amino acid chains that the gut can absorb efficiently. Studies show that hydrolysed collagen peptides stimulate fibroblasts — the skin cells responsible for producing new collagen — resulting in measurable improvements in skin hydration and elasticity after 8–12 weeks of consistent use.</p><h2>How to Maximise Absorption</h2><ul><li><strong>Take with Vitamin C</strong> — Vitamin C is a required cofactor in collagen synthesis. Taking your collagen alongside a Vitamin C source (or a supplement) significantly boosts the benefit.</li><li><strong>Take consistently</strong> — Benefits accrue over 8–12 weeks. One scoop occasionally won''t move the needle.</li><li><strong>Stir into warm liquid</strong> — Collagen powder dissolves well in warm water, coffee, or porridge.</li></ul><p>Our Healios Collagen Powder and Halo Glow formula are both hydrolysed and designed for daily use, making it easy to build this habit into your morning routine.</p>',
  '/products/halo-glow-collagen.png',
  'published',
  'cat-supplements',
  'Complete Guide to Collagen Supplements | Healios',
  'Everything you need to know about collagen supplements — types, benefits, absorption tips, and how to choose the right product for your goals.',
  7,
  '2026-01-22 08:00:00'
);

-- Statement 8: Post 3 — Vitamin D3 Deficiency
INSERT INTO blog_posts (id, slug, title, excerpt, content, featured_image, status, category_id, seo_title, meta_description, reading_time_minutes, published_at) VALUES (
  'post-vitd3',
  'vitamin-d3-deficiency',
  'Vitamin D3: Why Most of Us Are Deficient',
  'Vitamin D deficiency is one of the most widespread nutritional problems in the world — affecting an estimated 1 billion people. Despite South Africa''s sunny climate, deficiency is common, with symptoms ranging from persistent fatigue to weakened immunity and low mood.',
  '<p>Vitamin D is not really a vitamin — it''s a hormone your body synthesises when skin is exposed to ultraviolet B (UVB) rays from sunlight. This distinction matters: unlike true vitamins, very few foods contain meaningful amounts of Vitamin D. Sunlight is supposed to be the primary source. Yet deficiency is epidemic.</p><h2>Why Are We Deficient Despite Sunshine?</h2><p>Modern life keeps most of us indoors during peak UVB hours (10 am – 2 pm). When we are outside, sunscreen — rightly applied for skin cancer prevention — blocks UVB synthesis. Darker skin tones require more sun exposure to produce the same amount of Vitamin D. And as we age, skin becomes less efficient at the conversion process.</p><p>In South Africa specifically, studies have found high rates of deficiency across all demographics, particularly in urban populations and among individuals who cover most of their skin for cultural or religious reasons.</p><h2>What Vitamin D Does in the Body</h2><ul><li><strong>Immune function</strong> — Vitamin D receptors are present on virtually every immune cell. Deficiency is associated with increased susceptibility to respiratory infections.</li><li><strong>Bone health</strong> — Vitamin D regulates calcium absorption. Without adequate levels, bones lose density over time (contributing to osteoporosis).</li><li><strong>Mood regulation</strong> — Vitamin D influences serotonin production. Low levels are consistently linked with seasonal depression and general low mood.</li><li><strong>Muscle function</strong> — Deficiency is associated with muscle weakness and increased fall risk in older adults.</li></ul><h2>Signs You May Be Deficient</h2><p>Persistent fatigue, frequent colds and flu, bone or muscle aches, low mood, and slow wound healing can all indicate low Vitamin D. A simple blood test (25-OH Vitamin D) will confirm your levels. Optimal range is generally 75–150 nmol/L.</p><h2>Supplementing Effectively</h2><p>Vitamin D3 (cholecalciferol) is the preferred supplemental form — it''s the same type your body produces from sunlight, and it raises blood levels more effectively than D2. For most adults, 2000–4000 IU daily is a safe and effective maintenance dose. Higher doses may be needed to correct a significant deficiency — consult your healthcare provider.</p><p>Our Healios Vitamin D3 4000 IU Gummies provide a convenient, taste-approved way to hit your daily target consistently.</p>',
  '/products/vitamin-d3-gummies.png',
  'published',
  'cat-supplements',
  'Vitamin D3 Deficiency: Causes, Symptoms & How to Fix It | Healios',
  'Why Vitamin D deficiency is so common — even in sunny South Africa — and how to correct it with the right form and dose of supplementation.',
  6,
  '2026-02-05 08:00:00'
);

-- Statement 9: Post 4 — Skin Nutrition Tips
INSERT INTO blog_posts (id, slug, title, excerpt, content, featured_image, status, category_id, seo_title, meta_description, reading_time_minutes, published_at) VALUES (
  'post-skin',
  'skin-nutrition-tips',
  'Glow From Within: Nutrition Tips for Radiant Skin',
  'The most effective skincare routine starts at the dinner table. What you eat directly influences inflammation levels, hydration, collagen synthesis, and cellular turnover — all of which determine the quality and clarity of your skin.',
  '<p>The beauty industry generates billions each year selling topical solutions to problems that often originate from within. While quality skincare matters, the nutrients you provide — or fail to provide — your skin cells determine their fundamental health and function.</p><h2>Antioxidants: Your Skin''s Cellular Defence</h2><p>Free radicals (generated by UV exposure, pollution, stress, and poor diet) damage skin cell DNA and accelerate the breakdown of collagen. Antioxidants neutralise free radicals before they cause harm.</p><p><strong>Vitamin C</strong> is particularly important — it''s both a potent antioxidant and an essential cofactor for collagen synthesis. Load up on citrus fruit, bell peppers, guava, and kiwi. If your diet is inconsistent, a Vitamin C supplement is a sensible addition.</p><p><strong>Vitamin E</strong> works synergistically with Vitamin C and helps maintain skin barrier integrity. Found in nuts, seeds, and avocado.</p><h2>Healthy Fats for Hydration and Barrier Function</h2><p>Your skin cells are surrounded by a lipid (fat) membrane that determines moisture retention. Diets low in healthy fats result in dry, dull skin with a compromised barrier — making skin more reactive and prone to sensitivity.</p><p>Prioritise omega-3 fatty acids from oily fish (sardines, salmon, mackerel), walnuts, and flaxseed. Avocado and extra-virgin olive oil provide oleic acid which supports skin suppleness.</p><h2>Collagen Precursors</h2><p>Your body needs specific amino acids (glycine, proline, hydroxyproline) to build collagen. These are abundant in bone broth and a daily collagen peptide supplement. Pair with Vitamin C to maximise synthesis.</p><h2>Hydration: The Overlooked Essential</h2><p>Adequate water intake supports skin cell plumpness and the flushing of waste products. Aim for 2–2.5 litres per day, more in hot weather or during exercise. Herbal teas count; alcohol and excess caffeine have the opposite effect.</p><h2>Foods That Harm Skin</h2><p>High-glycaemic foods (refined sugar, white bread, sugary drinks) spike insulin and trigger a cascade of inflammation that degrades collagen and increases sebum production — contributing to breakouts and accelerated ageing. Excess dairy may worsen acne in some individuals due to hormonal content.</p><p>Our Hair, Skin & Nails Gummies and Halo Glow formula are designed to complement a nutrient-dense diet, providing biotin, collagen peptides, and key antioxidants in one daily dose.</p>',
  '/products/hair-skin-nails-gummies.png',
  'published',
  'cat-beauty',
  'Nutrition Tips for Radiant, Glowing Skin | Healios',
  'How what you eat affects your skin — the key nutrients for collagen, hydration, and cellular defence, and which foods to limit for a clearer complexion.',
  6,
  '2026-02-12 08:00:00'
);

-- Statement 10: Post 5 — Magnesium and Sleep
INSERT INTO blog_posts (id, slug, title, excerpt, content, featured_image, status, category_id, seo_title, meta_description, reading_time_minutes, published_at) VALUES (
  'post-magnesium',
  'magnesium-sleep',
  'How Magnesium Transforms Your Sleep Quality',
  'Magnesium is involved in over 300 enzymatic reactions in the body — including the regulation of the nervous system and the production of melatonin. If you struggle to fall asleep, stay asleep, or wake feeling unrefreshed, low magnesium may be a significant contributing factor.',
  '<p>Sleep is arguably the single most important factor in physical and mental health — yet the majority of adults don''t get the 7–9 hours of quality sleep required for full recovery. While poor sleep hygiene and stress are common culprits, nutritional deficiencies — particularly magnesium — are frequently overlooked.</p><h2>The Magnesium–Sleep Connection</h2><p>Magnesium activates the parasympathetic nervous system — the ''rest and digest'' mode that counters the stress response. It regulates GABA (gamma-aminobutyric acid) receptors in the brain, the same pathway targeted by anti-anxiety medications and sleep aids. Without sufficient magnesium, the nervous system remains in a higher state of arousal, making it difficult to fall asleep and stay asleep.</p><p>Magnesium also plays a role in the regulation of melatonin, the hormone that signals nighttime to your body. A deficiency can disrupt circadian rhythms, particularly in shift workers or frequent travellers.</p><h2>Are You Deficient?</h2><p>Magnesium deficiency is surprisingly common. Modern agricultural practices have reduced the magnesium content of soil — meaning the vegetables and grains we eat contain less than they did 50 years ago. Chronic stress, alcohol consumption, and high caffeine intake all deplete magnesium further. Estimates suggest up to 50% of adults in developed nations consume less than the recommended daily amount.</p><p>Symptoms of low magnesium include: difficulty falling asleep, frequent night waking, muscle cramps (particularly at night), restless legs, anxiety, irritability, and headaches.</p><h2>Best Forms of Magnesium for Sleep</h2><p><strong>Magnesium glycinate</strong> — Highly bioavailable and bound to glycine, an amino acid with its own calming properties. Least likely to cause digestive upset. Best for sleep support.</p><p><strong>Magnesium citrate</strong> — Good bioavailability, mild laxative effect at higher doses. Useful if you also experience constipation.</p><p><strong>Magnesium oxide</strong> — Poorly absorbed. Common in cheap supplements. Avoid for sleep purposes.</p><h2>How to Supplement for Sleep</h2><p>Take 200–400 mg of elemental magnesium 30–60 minutes before bed. Consistency over 2–4 weeks is typically when benefits become pronounced. Our Night-Time Magnesium Gummies use a bioavailable form and are designed specifically for evening use, making them easy to incorporate into a pre-sleep routine.</p><p>Pair with consistent sleep and wake times, a dark and cool room, and 30–60 minutes of screen-free wind-down time for best results.</p>',
  '/products/night-magnesium-gummies.png',
  'published',
  'cat-sleep',
  'Magnesium for Sleep: How It Works and How to Use It | Healios',
  'How magnesium regulates the nervous system and melatonin to improve sleep quality — and the best forms and timing for supplementation.',
  6,
  '2026-02-19 08:00:00'
);

-- Statement 11: Post 6 — Gut Health 101
INSERT INTO blog_posts (id, slug, title, excerpt, content, featured_image, status, category_id, seo_title, meta_description, reading_time_minutes, published_at) VALUES (
  'post-gut',
  'gut-health-101',
  'Gut Health 101: Probiotics, Prebiotics & Your Microbiome',
  'Your gut microbiome — the trillions of bacteria, fungi, and other microorganisms living in your digestive tract — influences far more than digestion. It shapes your immune system, mental health, metabolism, and even how you respond to stress. Here''s what you need to know.',
  '<p>The human gut contains approximately 100 trillion microorganisms — more cells than the rest of your body combined. This community of bacteria, viruses, and fungi is collectively called the gut microbiome, and its health has profound implications for your overall wellbeing.</p><h2>What a Healthy Microbiome Does</h2><p><strong>Digestion and nutrient absorption:</strong> Gut bacteria help break down fibre and complex carbohydrates that your own enzymes cannot digest, producing short-chain fatty acids that nourish the gut lining and support healthy bowel movements.</p><p><strong>Immune regulation:</strong> Approximately 70% of your immune system is located in your gut. A diverse microbiome helps train immune cells to distinguish between harmful pathogens and harmless substances, reducing the risk of allergies, autoimmune conditions, and chronic inflammation.</p><p><strong>Mental health (the gut-brain axis):</strong> Your gut produces about 90% of your body''s serotonin. The vagus nerve provides a direct communication pathway between the gut and the brain. Research links gut dysbiosis (microbiome imbalance) with anxiety, depression, and cognitive issues.</p><p><strong>Metabolism:</strong> Gut bacteria influence how calories are extracted from food, fat storage, and insulin sensitivity. Imbalanced microbiomes are associated with obesity and type 2 diabetes.</p><h2>Probiotics: Introducing Beneficial Bacteria</h2><p>Probiotics are live beneficial bacteria consumed through food or supplements. They temporarily populate the gut, compete with harmful bacteria, and produce compounds that support gut lining integrity.</p><p><strong>Food sources:</strong> Yoghurt with live cultures, kefir, sauerkraut, kimchi, miso, and kombucha.</p><p><strong>Supplements:</strong> Look for products with multiple strains (Lactobacillus and Bifidobacterium species) and a high CFU (colony-forming unit) count — at least 10 billion CFU per dose for therapeutic benefit.</p><h2>Prebiotics: Feeding Your Good Bacteria</h2><p>Prebiotics are specialised plant fibres that feed beneficial gut bacteria, helping them multiply and thrive. Without adequate prebiotics, probiotic supplementation has limited long-term benefit.</p><p><strong>Best prebiotic foods:</strong> Garlic, onions, leeks, Jerusalem artichokes, bananas (especially slightly green ones), oats, and flaxseed.</p><h2>What Harms the Microbiome</h2><ul><li>Antibiotics (kill indiscriminately — always restore with probiotics after a course)</li><li>Ultra-processed foods and excess refined sugar (feed harmful bacteria)</li><li>Chronic stress (alters gut motility and microbiome composition)</li><li>Low fibre intake (starves beneficial bacteria)</li><li>Excessive alcohol</li></ul><p>Our Probiotic + Vitamin Mix and ACV & Ginger Gummies are formulated to support a balanced gut environment from multiple angles — combining live cultures, gut-soothing botanicals, and digestive enzymes in one convenient daily gummy.</p>',
  '/products/probiotics-vitamins-gummies.png',
  'published',
  'cat-gut',
  'Gut Health 101: Probiotics, Prebiotics & Your Microbiome | Healios',
  'How your gut microbiome affects immunity, mental health, and metabolism — and the key diet and supplement strategies to optimise gut health.',
  8,
  '2026-03-01 08:00:00'
);
