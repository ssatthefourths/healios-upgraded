"""Seed blog posts into Cloudflare D1 via wrangler."""
import subprocess
import json
import sys
import io

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

POSTS = [
    {
        "id": "post-habits",
        "slug": "daily-wellness-habits",
        "title": "5 Daily Habits for a Healthier You",
        "excerpt": "Small, consistent actions compound into remarkable results over time. These five evidence-backed habits can transform your wellbeing without overhauling your entire lifestyle. Start with one and build from there.",
        "content": "<p>Building lasting wellness does not require a dramatic overhaul. Research consistently shows that small, daily habits compounded over months create the most sustainable health improvements. Here are five habits worth adopting today.</p><h2>1. Hydrate Before You Caffeinate</h2><p>Your body loses water overnight through breathing and perspiration. Before reaching for coffee, drink 500 ml of water. This simple act kickstarts your metabolism, supports kidney function, and improves morning cognitive clarity. Add a slice of lemon for a gentle alkalising effect.</p><h2>2. Move Within the First Hour</h2><p>A 10-20 minute walk, stretch, or light workout within the first hour of waking sets your circadian rhythm, elevates mood through endorphin release, and improves insulin sensitivity for the rest of the day. You do not need a gym - a brisk walk around the block counts.</p><h2>3. Eat a Protein-Forward Breakfast</h2><p>Protein at breakfast stabilises blood sugar, reduces mid-morning cravings, and supports muscle maintenance. Aim for at least 20-30 g of protein - eggs, Greek yoghurt, a quality protein shake, or our collagen powder stirred into porridge are all excellent choices.</p><h2>4. Take Your Daily Supplements Consistently</h2><p>Supplements are most effective when taken at the same time each day, ideally with food. Set a phone reminder. Whether it is Vitamin D3 for immune and bone support or Ashwagandha to manage daily stress, consistency is what delivers results over weeks and months.</p><h2>5. Wind Down Intentionally</h2><p>The quality of your sleep determines how well you recover and perform the next day. Begin dimming lights and reducing screen exposure 60 minutes before bed. A magnesium supplement taken in the evening supports muscle relaxation and deeper sleep stages.</p>",
        "featured_image": "/products/ashwagandha-gummies.png",
        "category_id": "cat-wellness",
        "seo_title": "5 Daily Wellness Habits | Healios",
        "meta_description": "Five evidence-backed daily habits to improve your energy, sleep, and overall wellbeing without overhauling your entire lifestyle.",
        "reading_time_minutes": 5,
        "published_at": "2026-01-15 08:00:00",
    },
    {
        "id": "post-collagen",
        "slug": "collagen-guide",
        "title": "The Complete Guide to Collagen Supplements",
        "excerpt": "Collagen is the most abundant protein in your body, yet production declines by roughly 1% per year after age 25. Understanding what collagen does, which type to take, and how to maximise absorption can make a significant difference to your skin, joints, and overall vitality.",
        "content": "<p>Collagen accounts for about 30% of all the protein in your body. It provides the structural framework for skin, tendons, ligaments, cartilage, and bones. From your late twenties, your body produces progressively less of it, a process accelerated by sun exposure, smoking, excess sugar, and chronic stress.</p><h2>What Collagen Does</h2><p>Collagen fibres act like scaffolding. In skin, they maintain firmness and elasticity. In joints, they cushion and lubricate. In the gut lining, they support integrity and barrier function. As levels decline, these tissues become less resilient.</p><h2>Types of Collagen</h2><p>Type I is the most abundant, found in skin, hair, nails, tendons, and bones. Most beauty-focused collagen products use Type I. Type II is primarily found in cartilage and is relevant for joint health. Type III is found alongside Type I in skin and blood vessels and is often included in multi-collagen blends.</p><h2>Hydrolysed Collagen Peptides</h2><p>Raw collagen is poorly absorbed. Hydrolysed collagen (also called collagen peptides) has been broken into shorter amino acid chains that the gut can absorb efficiently. Studies show that hydrolysed collagen peptides stimulate fibroblasts, resulting in measurable improvements in skin hydration and elasticity after 8-12 weeks of consistent use.</p><h2>How to Maximise Absorption</h2><p>Take with Vitamin C, which is a required cofactor in collagen synthesis. Take consistently, as benefits accrue over 8-12 weeks. Stir into warm liquid as collagen powder dissolves well in warm water, coffee, or porridge.</p>",
        "featured_image": "/products/halo-glow-collagen.png",
        "category_id": "cat-supplements",
        "seo_title": "Complete Guide to Collagen Supplements | Healios",
        "meta_description": "Everything you need to know about collagen supplements, types, benefits, absorption tips, and how to choose the right product for your goals.",
        "reading_time_minutes": 7,
        "published_at": "2026-01-22 08:00:00",
    },
    {
        "id": "post-vitd3",
        "slug": "vitamin-d3-deficiency",
        "title": "Vitamin D3: Why Most of Us Are Deficient",
        "excerpt": "Vitamin D deficiency is one of the most widespread nutritional problems in the world, affecting an estimated 1 billion people. Despite South Africa sunny climate, deficiency is common, with symptoms ranging from persistent fatigue to weakened immunity and low mood.",
        "content": "<p>Vitamin D is not really a vitamin, it is a hormone your body synthesises when skin is exposed to ultraviolet B (UVB) rays from sunlight. This distinction matters: unlike true vitamins, very few foods contain meaningful amounts of Vitamin D. Sunlight is supposed to be the primary source. Yet deficiency is epidemic.</p><h2>Why Are We Deficient Despite Sunshine?</h2><p>Modern life keeps most of us indoors during peak UVB hours (10 am to 2 pm). When we are outside, sunscreen, rightly applied for skin cancer prevention, blocks UVB synthesis. Darker skin tones require more sun exposure to produce the same amount of Vitamin D. And as we age, skin becomes less efficient at the conversion process.</p><h2>What Vitamin D Does in the Body</h2><p>Immune function: Vitamin D receptors are present on virtually every immune cell. Deficiency is associated with increased susceptibility to respiratory infections. Bone health: Vitamin D regulates calcium absorption. Without adequate levels, bones lose density over time. Mood regulation: Vitamin D influences serotonin production. Low levels are consistently linked with seasonal depression and general low mood.</p><h2>Supplementing Effectively</h2><p>Vitamin D3 (cholecalciferol) is the preferred supplemental form. For most adults, 2000-4000 IU daily is a safe and effective maintenance dose. Our Healios Vitamin D3 4000 IU Gummies provide a convenient, taste-approved way to hit your daily target consistently.</p>",
        "featured_image": "/products/vitamin-d3-gummies.png",
        "category_id": "cat-supplements",
        "seo_title": "Vitamin D3 Deficiency: Causes, Symptoms and How to Fix It | Healios",
        "meta_description": "Why Vitamin D deficiency is so common, even in sunny South Africa, and how to correct it with the right form and dose of supplementation.",
        "reading_time_minutes": 6,
        "published_at": "2026-02-05 08:00:00",
    },
    {
        "id": "post-skin",
        "slug": "skin-nutrition-tips",
        "title": "Glow From Within: Nutrition Tips for Radiant Skin",
        "excerpt": "The most effective skincare routine starts at the dinner table. What you eat directly influences inflammation levels, hydration, collagen synthesis, and cellular turnover, all of which determine the quality and clarity of your skin.",
        "content": "<p>The beauty industry generates billions each year selling topical solutions to problems that often originate from within. While quality skincare matters, the nutrients you provide your skin cells determine their fundamental health and function.</p><h2>Antioxidants: Your Skin Defence</h2><p>Free radicals, generated by UV exposure, pollution, stress, and poor diet, damage skin cell DNA and accelerate the breakdown of collagen. Antioxidants neutralise free radicals before they cause harm. Vitamin C is particularly important. It is both a potent antioxidant and an essential cofactor for collagen synthesis. Load up on citrus fruit, bell peppers, guava, and kiwi.</p><h2>Healthy Fats for Hydration and Barrier Function</h2><p>Your skin cells are surrounded by a lipid membrane that determines moisture retention. Diets low in healthy fats result in dry, dull skin with a compromised barrier. Prioritise omega-3 fatty acids from oily fish, walnuts, and flaxseed. Avocado and extra-virgin olive oil support skin suppleness.</p><h2>Collagen Precursors</h2><p>Your body needs specific amino acids (glycine, proline, hydroxyproline) to build collagen. These are abundant in bone broth and a daily collagen peptide supplement. Pair with Vitamin C to maximise synthesis.</p><h2>Hydration</h2><p>Adequate water intake supports skin cell plumpness and the flushing of waste products. Aim for 2-2.5 litres per day. Our Hair, Skin and Nails Gummies and Halo Glow formula complement a nutrient-dense diet, providing biotin, collagen peptides, and key antioxidants in one daily dose.</p>",
        "featured_image": "/products/hair-skin-nails-gummies.png",
        "category_id": "cat-beauty",
        "seo_title": "Nutrition Tips for Radiant, Glowing Skin | Healios",
        "meta_description": "How what you eat affects your skin, the key nutrients for collagen, hydration, and cellular defence, and which foods to limit for a clearer complexion.",
        "reading_time_minutes": 6,
        "published_at": "2026-02-12 08:00:00",
    },
    {
        "id": "post-magnesium",
        "slug": "magnesium-sleep",
        "title": "How Magnesium Transforms Your Sleep Quality",
        "excerpt": "Magnesium is involved in over 300 enzymatic reactions in the body, including the regulation of the nervous system and the production of melatonin. If you struggle to fall asleep, stay asleep, or wake feeling unrefreshed, low magnesium may be a significant contributing factor.",
        "content": "<p>Sleep is arguably the single most important factor in physical and mental health, yet the majority of adults do not get the 7-9 hours of quality sleep required for full recovery. While poor sleep hygiene and stress are common culprits, nutritional deficiencies, particularly magnesium, are frequently overlooked.</p><h2>The Magnesium Sleep Connection</h2><p>Magnesium activates the parasympathetic nervous system, the rest and digest mode that counters the stress response. It regulates GABA receptors in the brain, the same pathway targeted by anti-anxiety medications and sleep aids. Without sufficient magnesium, the nervous system remains in a higher state of arousal, making it difficult to fall asleep and stay asleep.</p><h2>Are You Deficient?</h2><p>Magnesium deficiency is surprisingly common. Modern agricultural practices have reduced the magnesium content of soil. Chronic stress, alcohol consumption, and high caffeine intake all deplete magnesium further. Symptoms include difficulty falling asleep, frequent night waking, muscle cramps, restless legs, anxiety, irritability, and headaches.</p><h2>Best Forms for Sleep</h2><p>Magnesium glycinate is highly bioavailable and bound to glycine, an amino acid with its own calming properties. It is the best choice for sleep support. Take 200-400 mg 30-60 minutes before bed. Our Night-Time Magnesium Gummies use a bioavailable form designed specifically for evening use.</p>",
        "featured_image": "/products/night-magnesium-gummies.png",
        "category_id": "cat-sleep",
        "seo_title": "Magnesium for Sleep: How It Works and How to Use It | Healios",
        "meta_description": "How magnesium regulates the nervous system and melatonin to improve sleep quality, and the best forms and timing for supplementation.",
        "reading_time_minutes": 6,
        "published_at": "2026-02-19 08:00:00",
    },
    {
        "id": "post-gut",
        "slug": "gut-health-101",
        "title": "Gut Health 101: Probiotics, Prebiotics and Your Microbiome",
        "excerpt": "Your gut microbiome, the trillions of bacteria, fungi, and other microorganisms living in your digestive tract, influences far more than digestion. It shapes your immune system, mental health, metabolism, and even how you respond to stress.",
        "content": "<p>The human gut contains approximately 100 trillion microorganisms, more cells than the rest of your body combined. This community of bacteria, viruses, and fungi is collectively called the gut microbiome, and its health has profound implications for your overall wellbeing.</p><h2>What a Healthy Microbiome Does</h2><p>Digestion and nutrient absorption: Gut bacteria help break down fibre and complex carbohydrates that your own enzymes cannot digest, producing short-chain fatty acids that nourish the gut lining. Immune regulation: Approximately 70% of your immune system is located in your gut. A diverse microbiome helps train immune cells to distinguish between harmful pathogens and harmless substances. Mental health: Your gut produces about 90% of your body serotonin. Research links gut dysbiosis with anxiety, depression, and cognitive issues.</p><h2>Probiotics: Introducing Beneficial Bacteria</h2><p>Probiotics are live beneficial bacteria consumed through food or supplements. Food sources include yoghurt with live cultures, kefir, sauerkraut, kimchi, miso, and kombucha. For supplements, look for multiple strains and at least 10 billion CFU per dose.</p><h2>Prebiotics: Feeding Your Good Bacteria</h2><p>Prebiotics are specialised plant fibres that feed beneficial gut bacteria. Best prebiotic foods include garlic, onions, leeks, bananas, oats, and flaxseed. Without adequate prebiotics, probiotic supplementation has limited long-term benefit.</p><p>Our Probiotic and Vitamin Mix and ACV and Ginger Gummies are formulated to support a balanced gut environment from multiple angles.</p>",
        "featured_image": "/products/probiotics-vitamins-gummies.png",
        "category_id": "cat-gut",
        "seo_title": "Gut Health 101: Probiotics, Prebiotics and Your Microbiome | Healios",
        "meta_description": "How your gut microbiome affects immunity, mental health, and metabolism, and the key diet and supplement strategies to optimise gut health.",
        "reading_time_minutes": 8,
        "published_at": "2026-03-01 08:00:00",
    },
]


def esc(val):
    """Escape a string value for SQLite — double single-quotes."""
    return val.replace("'", "''")


AUTHOR_ID = "admin-user-id"


def run_insert(post):
    sql = (
        "INSERT INTO blog_posts "
        "(id, slug, title, excerpt, content, featured_image, status, category_id, "
        "author_id, seo_title, meta_description, reading_time_minutes, published_at) VALUES ("
        f"'{esc(post['id'])}', "
        f"'{esc(post['slug'])}', "
        f"'{esc(post['title'])}', "
        f"'{esc(post['excerpt'])}', "
        f"'{esc(post['content'])}', "
        f"'{esc(post['featured_image'])}', "
        f"'published', "
        f"'{esc(post['category_id'])}', "
        f"'{AUTHOR_ID}', "
        f"'{esc(post['seo_title'])}', "
        f"'{esc(post['meta_description'])}', "
        f"{post['reading_time_minutes']}, "
        f"'{esc(post['published_at'])}'"
        ")"
    )
    result = subprocess.run(
        ["npx", "wrangler", "d1", "execute", "healios-db", "--command", sql, "--remote"],
        capture_output=True,
        shell=True,
    )
    stdout = (result.stdout or b"").decode("utf-8", errors="replace")
    if '"changed_db": true' in stdout or '"success": true' in stdout:
        print(f"  OK: {post['slug']}")
        return True
    else:
        print(f"  FAIL: {post['slug']}")
        print(stdout[-800:])
        stderr = (result.stderr or b"").decode("utf-8", errors="replace")
        print(stderr[-200:])
        return False


if __name__ == "__main__":
    ok = 0
    fail = 0
    for post in POSTS:
        if run_insert(post):
            ok += 1
        else:
            fail += 1
    print(f"\nDone: {ok} inserted, {fail} failed")
