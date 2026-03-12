import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen } from 'lucide-react';

interface EducationItem {
  question: string;
  answer: string;
}

interface CategoryEducationData {
  heading: string;
  intro: string;
  items: EducationItem[];
}

const educationContent: Record<string, CategoryEducationData> = {
  'Vitamins & Minerals': {
    heading: 'Understanding Vitamins & Minerals',
    intro: 'Vitamins and minerals are essential micronutrients your body needs in small amounts to function properly. While they often appear together, they are fundamentally different — and understanding the distinction can help you choose the right supplements for your needs.',
    items: [
      {
        question: 'What is a vitamin, and how does it work in your body?',
        answer: 'Vitamins are organic compounds produced by plants and animals. Your body uses them to support hundreds of biological processes — from converting food into energy to repairing cellular damage. They are categorised as either fat-soluble (A, D, E, K), which are stored in body fat and the liver, or water-soluble (B vitamins, vitamin C), which need to be replenished regularly as they are not stored. Each vitamin has a specific role: Vitamin D supports calcium absorption for healthy bones, Vitamin C contributes to normal immune function, and B vitamins help reduce tiredness and fatigue.',
      },
      {
        question: 'What is a mineral, and how is it different from a vitamin?',
        answer: 'Minerals are inorganic elements that come from soil and water, absorbed by plants or consumed by animals. Unlike vitamins, minerals maintain their chemical structure — your body cannot break them down. They are divided into macro-minerals (calcium, magnesium, potassium) needed in larger amounts, and trace minerals (iron, zinc, selenium) needed in smaller amounts. Minerals play structural roles — calcium and phosphorus build bones and teeth — and functional roles — iron carries oxygen in your blood, while magnesium supports over 300 enzymatic reactions.',
      },
      {
        question: 'Why might I need a vitamin or mineral supplement?',
        answer: 'Even with a balanced diet, certain factors can make it difficult to get adequate nutrients: limited sun exposure reduces Vitamin D synthesis, plant-based diets may lack B12 and iron, and busy lifestyles can lead to nutritional gaps. Supplements are not a replacement for a varied diet, but they can help bridge specific shortfalls. The key is understanding which nutrients you may be missing and choosing targeted support rather than taking everything at once.',
      },
      {
        question: 'How are gummy vitamins absorbed compared to tablets?',
        answer: 'Gummy vitamins begin dissolving in the mouth, which can support earlier absorption through the oral mucosa. Because they are chewed rather than swallowed whole, they are broken down more readily in the stomach. This makes them a particularly good option for those who struggle with swallowing tablets. Our gummies are formulated to deliver clinically relevant doses of each nutrient in a form your body can utilise efficiently.',
      },
    ],
  },
  'Adaptogens': {
    heading: 'Understanding Adaptogens',
    intro: 'Adaptogens are a class of herbs and mushrooms that have been used for centuries in traditional medicine systems including Ayurveda and Traditional Chinese Medicine. In recent years, modern research has begun to explore how these natural compounds interact with the body\'s stress-response systems.',
    items: [
      {
        question: 'What exactly is an adaptogen?',
        answer: 'The term "adaptogen" was coined in 1947 by Russian scientist Dr. Nikolai Lazarev. It refers to natural substances that help the body adapt to stress and restore normal physiological function. To qualify as an adaptogen, a substance must meet three criteria: it must be non-toxic at normal doses, it must help the body resist a wide range of stressors (physical, chemical, and biological), and it must have a normalising effect — meaning it helps bring the body back to balance rather than pushing it in one direction. Common adaptogens include Ashwagandha, Lion\'s Mane mushroom, Rhodiola, and Holy Basil.',
      },
      {
        question: 'How do adaptogens work in the body?',
        answer: 'Adaptogens primarily work by modulating the hypothalamic-pituitary-adrenal (HPA) axis — the body\'s central stress-response system. When you encounter stress, your body releases cortisol. Chronic stress can dysregulate this system, leading to fatigue, poor sleep, and reduced cognitive function. Adaptogens help regulate cortisol production so your body responds more proportionally to stressors. They also support cellular energy production and may have antioxidant and anti-inflammatory properties. The effects are typically subtle and cumulative — most people notice benefits after consistent use over several weeks.',
      },
      {
        question: 'Do I actually need adaptogens?',
        answer: 'Adaptogens are not essential nutrients like vitamins — your body does not require them to survive. However, if you experience ongoing mental or physical stress, difficulty winding down, or feel that your energy and focus fluctuate throughout the day, adaptogens may offer supportive benefits. They work best as part of a holistic approach alongside good sleep, regular movement, and balanced nutrition. They are not a quick fix, but rather a gentle, long-term support for your body\'s resilience.',
      },
      {
        question: 'What is the difference between Ashwagandha and Lion\'s Mane?',
        answer: 'Ashwagandha (Withania somnifera) is a root herb traditionally used to support relaxation and reduce feelings of stress. Research suggests it may help maintain normal cortisol levels and support restful sleep. Lion\'s Mane (Hericium erinaceus) is a functional mushroom traditionally associated with cognitive support. Studies suggest it may support nerve growth factor (NGF) production, which plays a role in brain cell maintenance and cognitive function. In simple terms: Ashwagandha is more associated with calm and stress resilience, while Lion\'s Mane is more associated with focus and mental clarity.',
      },
    ],
  },
  'Digestive Health': {
    heading: 'Understanding Digestive Health',
    intro: 'Your digestive system does far more than process food. It houses roughly 70% of your immune system and produces the majority of your body\'s serotonin. Understanding how digestion works can help you make informed choices about supporting your gut health.',
    items: [
      {
        question: 'Why is gut health considered so important?',
        answer: 'Your gut microbiome — the trillions of bacteria living in your digestive tract — plays a central role in nutrient absorption, immune defence, mood regulation, and even skin health. An imbalanced microbiome (known as dysbiosis) has been linked to digestive discomfort, low energy, and reduced immune resilience. Supporting your gut with the right nutrients and beneficial bacteria can have wide-reaching effects beyond just digestion.',
      },
      {
        question: 'What are probiotics, and how do they help?',
        answer: 'Probiotics are live beneficial bacteria that, when consumed in adequate amounts, confer a health benefit. They work by colonising the gut, competing with harmful bacteria for resources, and supporting the intestinal barrier. Different strains serve different purposes: Lactobacillus strains are commonly associated with digestive comfort, while Bifidobacterium strains may support immune function. Probiotic supplements can be particularly beneficial after antibiotics, during travel, or when dietary variety is limited.',
      },
      {
        question: 'What role does apple cider vinegar play in digestion?',
        answer: 'Apple cider vinegar (ACV) contains acetic acid, which may support digestive processes by helping maintain a healthy pH in the stomach. Some people find it supports feelings of comfort after meals. While research is ongoing, ACV has been used in traditional wellness practices for centuries. Our ACV gummies provide the benefits without the harsh taste, making it easier to incorporate into a daily routine.',
      },
      {
        question: 'How does turmeric support digestive health?',
        answer: 'Turmeric contains curcumin, a compound with well-documented antioxidant properties. In the context of digestion, curcumin may support the body\'s natural inflammatory response in the gut lining, contributing to digestive comfort. Curcumin is notoriously difficult to absorb on its own, which is why many formulations include piperine (black pepper extract) or are designed in formats that enhance bioavailability.',
      },
    ],
  },
  'Sleep & Relaxation': {
    heading: 'Understanding Sleep & Relaxation',
    intro: 'Sleep is not a luxury — it is a biological necessity. During sleep, your body repairs tissues, consolidates memories, regulates hormones, and restores immune function. Understanding the science of sleep can help you identify what support you might benefit from.',
    items: [
      {
        question: 'Why is quality sleep so important for overall health?',
        answer: 'Adults need 7–9 hours of quality sleep per night. During deep sleep, your body releases growth hormone for tissue repair, your brain clears metabolic waste through the glymphatic system, and your immune system produces cytokines that help fight infection. Chronically poor sleep is associated with impaired cognitive function, weakened immunity, increased stress hormones, and reduced emotional regulation. Improving sleep quality is one of the most impactful things you can do for your overall wellbeing.',
      },
      {
        question: 'How does magnesium support sleep and relaxation?',
        answer: 'Magnesium is involved in over 300 biochemical reactions in the body, including those that regulate the nervous system. It activates the parasympathetic nervous system — the system responsible for helping you calm down and relax. Magnesium also regulates the neurotransmitter GABA, which promotes relaxation and is essential for transitioning into sleep. Many people in the UK do not consume adequate magnesium through diet alone, making it one of the most common nutritional gaps.',
      },
      {
        question: 'What is the difference between being tired and having poor sleep quality?',
        answer: 'Feeling tired can result from many factors — diet, hydration, stress, or physical exertion. Poor sleep quality specifically refers to disrupted sleep architecture: difficulty falling asleep, frequent waking, insufficient deep sleep, or waking unrefreshed. You can spend 8 hours in bed and still experience poor quality sleep. Factors like blue light exposure, irregular schedules, stimulants, and mineral deficiencies can all affect how restorative your sleep is.',
      },
      {
        question: 'Can supplements replace good sleep hygiene?',
        answer: 'No supplement can replace the fundamentals of sleep hygiene: a consistent sleep schedule, a dark and cool bedroom, limited screen time before bed, and managing stress. However, targeted nutrients like magnesium can support the biological processes that facilitate quality sleep. Think of supplements as one tool in a broader toolkit — they work best when combined with healthy sleep habits rather than used as a standalone solution.',
      },
    ],
  },
  'Beauty': {
    heading: 'Understanding Beauty Nutrition',
    intro: 'True beauty nutrition works from the inside out. Your skin, hair, and nails are among the last tissues to receive nutrients from your diet — meaning deficiencies often show up here first. Understanding which nutrients support these tissues can help you make targeted choices.',
    items: [
      {
        question: 'How does collagen support skin health?',
        answer: 'Collagen is the most abundant protein in your body, providing structure to skin, hair, nails, joints, and connective tissue. From your mid-twenties, your body\'s natural collagen production declines by approximately 1–1.5% per year. Hydrolysed collagen peptides in supplements are broken down into smaller molecules that can be absorbed and used by the body to support its natural collagen synthesis. Consistent intake over 8–12 weeks is typically when people begin to notice changes in skin hydration and elasticity.',
      },
      {
        question: 'What role does biotin play in hair and nail health?',
        answer: 'Biotin (Vitamin B7) is a water-soluble vitamin that contributes to the maintenance of normal hair and skin. It plays a role in keratin production — the protein that makes up the structural foundation of hair and nails. While biotin deficiency is uncommon, suboptimal levels can manifest as brittle nails or thinning hair. Supplementing with biotin supports these structures, particularly when combined with other supportive nutrients like zinc and selenium.',
      },
      {
        question: 'Why do skin supplements take time to work?',
        answer: 'Your skin cells have a natural turnover cycle of approximately 28 days, and hair grows at roughly 1cm per month. This means that any nutritional intervention — whether through diet or supplements — takes time to manifest visibly. Nutrients first serve critical internal functions (organ health, immune function) before being allocated to skin, hair, and nails. This is why consistency over weeks and months matters far more than short-term use.',
      },
      {
        question: 'Can nutrition really affect how my skin looks?',
        answer: 'Absolutely. Your skin is your largest organ and is highly responsive to nutritional status. Vitamin C is essential for collagen synthesis and protection against oxidative stress. Zinc supports skin cell renewal. Omega-3 fatty acids maintain the skin\'s lipid barrier. Antioxidants help neutralise free radicals from UV exposure and pollution. While topical skincare addresses the surface, nutritional support works at the cellular level — and the two approaches complement each other.',
      },
    ],
  },
  "Women's Health": {
    heading: "Understanding Women's Health Nutrition",
    intro: "Women's nutritional needs shift across different life stages — from menstruation to pregnancy planning to menopause. Understanding these changes can help you provide your body with targeted support when it matters most.",
    items: [
      {
        question: "Why do women have different nutritional needs?",
        answer: "Hormonal fluctuations throughout the menstrual cycle, pregnancy, and menopause create varying nutrient demands. Iron needs are higher during menstruation due to blood loss. Folic acid is critical during pre-conception and early pregnancy for neural tube development. Calcium and Vitamin D become increasingly important during perimenopause as oestrogen decline affects bone density. These are not marketing claims — they are well-established nutritional science.",
      },
      {
        question: "What role does folic acid play, and who needs it?",
        answer: "Folic acid (Vitamin B9) is essential for DNA synthesis and cell division. It is most well-known for its role in preventing neural tube defects during early pregnancy — often before a woman even knows she is pregnant. The UK Department of Health recommends 400mcg of folic acid daily for all women who could become pregnant. Beyond pregnancy, folate supports normal blood formation and contributes to the reduction of tiredness and fatigue.",
      },
      {
        question: "Why is iron particularly important for women?",
        answer: "Women of reproductive age lose iron through menstruation, with heavier periods increasing the risk of iron depletion. Iron contributes to normal oxygen transport in the blood, energy-yielding metabolism, and cognitive function. Iron deficiency is the most common nutritional deficiency worldwide and can manifest as persistent fatigue, difficulty concentrating, and pale skin. Our Iron & Vitamin C gummies pair iron with Vitamin C to enhance absorption, as Vitamin C helps convert iron into a form more easily used by the body.",
      },
    ],
  },
  'keto-friendly': {
    heading: 'Understanding Keto-Friendly Supplements',
    intro: 'The ketogenic diet is a high-fat, low-carbohydrate eating pattern that shifts your body into a metabolic state called ketosis. Choosing keto-compatible supplements ensures you stay on track without hidden carbs or sugars undermining your progress.',
    items: [
      {
        question: 'What does "keto-friendly" actually mean?',
        answer: 'A product is considered keto-friendly when it contains very low or negligible net carbohydrates — typically under 1–2g per serving. Net carbs are calculated by subtracting fibre and certain sugar alcohols from total carbohydrates. This matters because consuming too many carbs can knock your body out of ketosis, the metabolic state where your body burns fat for fuel instead of glucose. Our keto-friendly products are formulated to support your nutritional needs without disrupting this balance.',
      },
      {
        question: 'Why is it important to check supplements on a keto diet?',
        answer: 'Many conventional gummy vitamins and supplements contain added sugars, glucose syrup, or maltodextrin — all of which can spike blood sugar and interrupt ketosis. Even small amounts can add up across multiple supplements. By choosing specifically keto-friendly formulations, you can maintain your daily macro targets while still getting essential vitamins and minerals your body needs.',
      },
      {
        question: 'Can I get all my nutrients on a ketogenic diet?',
        answer: 'The ketogenic diet restricts several food groups (grains, most fruits, some vegetables), which can create gaps in micronutrient intake. Common deficiencies on keto include magnesium, potassium, B vitamins, and Vitamin D. Targeted supplementation can help bridge these gaps. Electrolyte balance is also particularly important during the first weeks of keto adaptation — a period often called the "keto flu."',
      },
      {
        question: 'How do Healios products fit into a keto lifestyle?',
        answer: 'Our products are low in carbohydrates and formulated without added sugars. We use natural sweeteners that have minimal impact on blood sugar levels. Each product page displays full nutritional information so you can accurately track your macros. Whether you are in strict ketosis or following a more relaxed low-carb approach, our supplements are designed to complement your diet rather than compromise it.',
      },
    ],
  },
  'vegan': {
    heading: 'Understanding Vegan Supplements',
    intro: 'Choosing vegan supplements means selecting products free from any animal-derived ingredients — including gelatin, collagen, beeswax, and carmine. Understanding what makes a supplement truly vegan helps you make confident, aligned choices.',
    items: [
      {
        question: 'What makes a supplement vegan?',
        answer: 'A vegan supplement contains no animal-derived ingredients at any stage of production. Traditional gummy vitamins often use gelatin (derived from animal bones and skin) as a base. Vegan gummies use plant-based alternatives like pectin (derived from fruit) or agar. Beyond the gummy base, ingredients like Vitamin D3 (often sourced from lanolin in sheep\'s wool) and collagen (always animal-derived) must be substituted with plant-based or lichen-derived alternatives.',
      },
      {
        question: 'Can I get the same nutritional benefits from vegan supplements?',
        answer: 'Absolutely. Plant-based formulations can deliver the same essential vitamins and minerals as their non-vegan counterparts. Vegan Vitamin D3, for example, is sourced from lichen and is bioidentical to the animal-derived version. The key difference is the source, not the efficacy. Our vegan products are formulated to provide clinically relevant doses using plant-based, cruelty-free ingredients.',
      },
      {
        question: 'Which nutrients are hardest to get on a plant-based diet?',
        answer: 'Common nutritional gaps in vegan and plant-based diets include Vitamin B12 (found almost exclusively in animal products), iron (plant-based iron is less readily absorbed), Vitamin D (limited food sources), and omega-3 fatty acids (typically from fish). Targeted supplementation can effectively address these gaps and support overall wellbeing on a plant-based diet.',
      },
    ],
  },
  'allergen-free': {
    heading: 'Understanding Allergens in Supplements',
    intro: 'Navigating food allergens can be complex, especially with supplements where ingredient lists may not be immediately obvious. Understanding common allergens and how to identify them helps you choose products with confidence.',
    items: [
      {
        question: 'What are the most common allergens in supplements?',
        answer: 'The 14 major allergens recognised under UK and EU law include gluten, dairy (milk), eggs, nuts, peanuts, soy, fish, shellfish, celery, mustard, sesame, lupin, molluscs, and sulphur dioxide. In supplements, the most common culprits are gelatin (animal-derived), soy lecithin (used as an emulsifier), dairy derivatives, and gluten from grain-based fillers. Our allergen-friendly products are formulated to avoid these common triggers.',
      },
      {
        question: 'How can I check if a product is safe for my allergy?',
        answer: 'Always check the full ingredient list and allergen declaration on the product label. "Free from" claims should be verified against the specific allergen you need to avoid. Cross-contamination is also a consideration — even if an ingredient is not present, products manufactured in shared facilities may carry trace amounts. Our product pages clearly list all ingredients and potential allergen information.',
      },
      {
        question: 'Are Healios products suitable for people with coeliac disease?',
        answer: 'All Healios products are gluten-free and suitable for individuals with coeliac disease or gluten sensitivity. We do not use wheat, barley, rye, or oat-derived ingredients in any of our formulations. Each product is tested to ensure compliance with gluten-free standards.',
      },
    ],
  },
  'gluten-free': {
    heading: 'Understanding Gluten-Free Supplements',
    intro: 'For those with coeliac disease or gluten sensitivity, even trace amounts of gluten can trigger adverse reactions. All Healios products are formulated to be gluten-free, giving you peace of mind with every supplement you take.',
    items: [
      {
        question: 'What is gluten and why do some people need to avoid it?',
        answer: 'Gluten is a group of proteins found in wheat, barley, rye, and their derivatives. For people with coeliac disease — an autoimmune condition affecting approximately 1 in 100 people in the UK — gluten triggers an immune response that damages the lining of the small intestine, impairing nutrient absorption. Non-coeliac gluten sensitivity can also cause digestive discomfort, fatigue, and headaches without the intestinal damage seen in coeliac disease.',
      },
      {
        question: 'Why might supplements contain gluten?',
        answer: 'Some supplements use wheat-derived starch, maltodextrin, or grain-based fillers as binding agents or bulking ingredients. Flavourings and colourings can also contain hidden gluten. Capsule shells may occasionally use wheat-based ingredients. This is why checking the "free from" declarations and full ingredient lists is important, even for products that appear straightforward.',
      },
      {
        question: 'How does Healios ensure products are gluten-free?',
        answer: 'We formulate all products without wheat, barley, rye, or oat-derived ingredients. Our manufacturing processes include quality checks to ensure compliance with gluten-free standards. Every product page provides complete ingredient transparency so you can verify suitability for your dietary requirements.',
      },
    ],
  },
  'sugar-free': {
    heading: 'Understanding No Added Sugar Supplements',
    intro: 'Many people are conscious about sugar intake — whether for dental health, blood sugar management, or general wellness. Understanding the difference between added sugars, natural sugars, and natural sweeteners helps you make informed choices.',
    items: [
      {
        question: 'What does "no added sugar" mean?',
        answer: '"No added sugar" means that no sucrose, glucose, fructose, or other refined sugars have been added during the manufacturing process. However, products may still contain naturally occurring sugars from fruit concentrates or natural flavourings. This distinction is important — "no added sugar" is not the same as "sugar-free." Our products use natural sweeteners to provide a pleasant taste while keeping sugar content minimal.',
      },
      {
        question: 'What natural sweeteners are used in gummy supplements?',
        answer: 'Common natural sweeteners include stevia (derived from the Stevia rebaudiana plant), erythritol (a sugar alcohol with near-zero calories), monk fruit extract, and xylitol. These alternatives provide sweetness without significantly impacting blood sugar levels. Each sweetener has different taste profiles and properties — for example, erythritol does not promote tooth decay, while stevia is up to 300 times sweeter than sugar by weight.',
      },
      {
        question: 'Is sugar in supplements something to worry about?',
        answer: 'In isolation, the sugar content in a single gummy vitamin is relatively small (typically 1–3g per serving). However, if you are taking multiple supplements daily, monitoring overall sugar intake, or managing conditions like diabetes, these amounts can add up. Choosing no-added-sugar formulations ensures your wellness routine supports rather than undermines your health goals.',
      },
    ],
  },
};

const CategoryEducation = ({ categoryName }: { categoryName: string }) => {
  const content = educationContent[categoryName];
  if (!content) return null;

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <div className="flex items-start gap-3 mb-4">
        <BookOpen className="h-6 w-6 text-primary mt-0.5 shrink-0" />
        <div>
          <h2 className="text-xl font-light text-foreground">{content.heading}</h2>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed max-w-3xl">
            {content.intro}
          </p>
        </div>
      </div>

      <Accordion type="multiple" className="mt-6 max-w-3xl">
        {content.items.map((item, index) => (
          <AccordionItem key={index} value={`edu-${index}`} className="border-border">
            <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-4">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default CategoryEducation;
