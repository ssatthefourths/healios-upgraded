import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Sparkles, ShoppingBag } from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  options: { label: string; value: string; icon: string }[];
  multiSelect?: boolean;
}

interface ProductRecommendation {
  id: string;
  name: string;
  image: string;
  price: number;
  reason: string;
  matchScore: number;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "primary_goal",
    question: "What's your primary wellness goal?",
    options: [
      { label: "More Energy", value: "energy", icon: "⚡" },
      { label: "Better Sleep", value: "sleep", icon: "🌙" },
      { label: "Stress Relief", value: "stress", icon: "🧘" },
      { label: "Immune Support", value: "immunity", icon: "🛡️" },
      { label: "Beauty & Glow", value: "beauty", icon: "✨" },
      { label: "Digestive Health", value: "digestion", icon: "🌿" },
    ],
  },
  {
    id: "secondary_goals",
    question: "Any other areas you'd like to support?",
    multiSelect: true,
    options: [
      { label: "Mental Clarity", value: "focus", icon: "🧠" },
      { label: "Hair & Nails", value: "hair_nails", icon: "💅" },
      { label: "Joint Health", value: "joints", icon: "🦴" },
      { label: "Mood Balance", value: "mood", icon: "😊" },
      { label: "Muscle Recovery", value: "muscle", icon: "💪" },
      { label: "Skin Health", value: "skin", icon: "🌸" },
    ],
  },
  {
    id: "lifestyle",
    question: "How would you describe your lifestyle?",
    options: [
      { label: "Very Active", value: "very_active", icon: "🏃" },
      { label: "Moderately Active", value: "moderate", icon: "🚶" },
      { label: "Mostly Sedentary", value: "sedentary", icon: "🪑" },
      { label: "High Stress Job", value: "high_stress", icon: "💼" },
    ],
  },
  {
    id: "sleep_quality",
    question: "How's your sleep quality?",
    options: [
      { label: "Great - 7-9 hours", value: "great", icon: "😴" },
      { label: "Okay - Sometimes restless", value: "okay", icon: "😐" },
      { label: "Poor - Trouble falling asleep", value: "poor_falling", icon: "😫" },
      { label: "Poor - Wake up often", value: "poor_waking", icon: "😵" },
    ],
  },
  {
    id: "diet",
    question: "How would you describe your diet?",
    options: [
      { label: "Very Balanced", value: "balanced", icon: "🥗" },
      { label: "Could Be Better", value: "average", icon: "🍕" },
      { label: "Vegetarian/Vegan", value: "plant_based", icon: "🌱" },
      { label: "Limited Variety", value: "limited", icon: "🍔" },
    ],
  },
  {
    id: "age_group",
    question: "Which age group are you in?",
    options: [
      { label: "Under 25", value: "under_25", icon: "🌟" },
      { label: "25-35", value: "25_35", icon: "🔥" },
      { label: "35-50", value: "35_50", icon: "💫" },
      { label: "Over 50", value: "over_50", icon: "🌞" },
    ],
  },
];

// Product mapping based on quiz answers
const productMappings: Record<string, string[]> = {
  energy: ["vitamin-d3-4000iu-gummies", "ashwagandha-gummies", "lions-mane-gummies", "morning-energy-stack"],
  sleep: ["sleep-support-gummies", "night-magnesium-gummies", "magnesium-gummies", "evening-wind-down-stack"],
  stress: ["ashwagandha-gummies", "magnesium-gummies", "lions-mane-gummies"],
  immunity: ["vitamin-d3-4000iu-gummies", "turmeric-ginger-gummies", "iron-vitamin-c-gummies", "immunity-boost-stack"],
  beauty: ["hair-skin-nails-complex", "halo-glow-collagen", "probiotics-vitamins-gummies", "beauty-glow-stack"],
  digestion: ["acv-ginger-gummies", "probiotics-vitamins-gummies", "turmeric-ginger-gummies"],
  focus: ["lions-mane-gummies", "ashwagandha-gummies"],
  hair_nails: ["hair-skin-nails-complex", "halo-glow-collagen"],
  joints: ["turmeric-ginger-gummies", "vitamin-d3-4000iu-gummies"],
  mood: ["ashwagandha-gummies", "magnesium-gummies", "vitamin-d3-4000iu-gummies"],
  muscle: ["magnesium-gummies", "vitamin-d3-4000iu-gummies"],
  skin: ["halo-glow-collagen", "hair-skin-nails-complex", "probiotics-vitamins-gummies"],
  very_active: ["magnesium-gummies", "vitamin-d3-4000iu-gummies", "iron-vitamin-c-gummies"],
  moderate: ["vitamin-d3-4000iu-gummies", "magnesium-gummies"],
  sedentary: ["vitamin-d3-4000iu-gummies", "magnesium-gummies"],
  high_stress: ["ashwagandha-gummies", "magnesium-gummies", "lions-mane-gummies"],
  poor_falling: ["sleep-support-gummies", "magnesium-gummies"],
  poor_waking: ["night-magnesium-gummies", "magnesium-gummies"],
  plant_based: ["vitamin-d3-4000iu-gummies", "iron-vitamin-c-gummies", "probiotics-vitamins-gummies"],
  limited: ["probiotics-vitamins-gummies", "vitamin-d3-4000iu-gummies", "iron-vitamin-c-gummies"],
  over_50: ["vitamin-d3-4000iu-gummies", "magnesium-gummies", "turmeric-ginger-gummies"],
};

const productDetails: Record<string, { name: string; image: string; price: number; category: string }> = {
  "vitamin-d3-4000iu-gummies": { name: "Vitamin D3 4000 IU Gummies", image: "/products/vitamin-d3-gummies.png", price: 14.99, category: "Vitamins" },
  "ashwagandha-gummies": { name: "Ashwagandha 600mg Gummies", image: "/products/ashwagandha-gummies.png", price: 16.99, category: "Adaptogens" },
  "lions-mane-gummies": { name: "Lion's Mane Gummies", image: "/products/lions-mane-gummies.png", price: 18.99, category: "Adaptogens" },
  "sleep-support-gummies": { name: "Sleep Support Gummies", image: "/products/sleep-support-gummies.png", price: 15.99, category: "Sleep" },
  "night-magnesium-gummies": { name: "Night Time Magnesium Gummies", image: "/products/night-magnesium-gummies.png", price: 14.99, category: "Sleep" },
  "magnesium-gummies": { name: "Magnesium Gummies", image: "/products/magnesium-gummies.png", price: 13.99, category: "Vitamins" },
  "hair-skin-nails-complex": { name: "Hair, Skin & Nails Complex", image: "/products/hair-skin-nails-gummies.png", price: 17.99, category: "Beauty" },
  "halo-glow-collagen": { name: "Halo Glow Collagen Powder", image: "/products/halo-glow-collagen.png", price: 24.99, category: "Beauty" },
  "probiotics-vitamins-gummies": { name: "Probiotics + Vitamins Gummies", image: "/products/probiotics-vitamins-gummies.png", price: 15.99, category: "Digestive" },
  "acv-ginger-gummies": { name: "Apple Cider Vinegar & Ginger", image: "/products/acv-ginger-gummies.png", price: 14.99, category: "Digestive" },
  "turmeric-ginger-gummies": { name: "Turmeric & Ginger Gummies", image: "/products/turmeric-ginger-gummies.png", price: 15.99, category: "Adaptogens" },
  "iron-vitamin-c-gummies": { name: "Iron & Vitamin C Gummies", image: "/products/iron-vitamin-c-gummies.png", price: 13.99, category: "Vitamins" },
  "morning-energy-stack": { name: "Morning Energy Stack", image: "/products/morning-energy-stack.png", price: 44.99, category: "Bundles" },
  "evening-wind-down-stack": { name: "Evening Wind-Down Stack", image: "/products/evening-wind-down-stack.png", price: 39.99, category: "Bundles" },
  "immunity-boost-stack": { name: "Immunity Boost Stack", image: "/products/immunity-boost-stack.png", price: 39.99, category: "Bundles" },
  "beauty-glow-stack": { name: "Beauty Glow Stack", image: "/products/beauty-glow-stack.png", price: 49.99, category: "Bundles" },
};

const goalReasons: Record<string, string> = {
  energy: "to boost your natural energy levels",
  sleep: "to support restful, quality sleep",
  stress: "to help manage stress and promote calm",
  immunity: "to strengthen your immune defenses",
  beauty: "to nourish your skin, hair and nails from within",
  digestion: "to support healthy digestion",
  focus: "to enhance mental clarity and focus",
  hair_nails: "to promote strong hair and nails",
  joints: "to support joint comfort and flexibility",
  mood: "to help balance your mood naturally",
  muscle: "to aid muscle function and recovery",
  skin: "to promote healthy, glowing skin",
};

const WellnessQuiz = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);

  const currentQuestion = quizQuestions[currentStep];
  const progress = ((currentStep + 1) / quizQuestions.length) * 100;

  const handleSelectOption = (value: string) => {
    if (currentQuestion.multiSelect) {
      const currentSelections = (answers[currentQuestion.id] as string[]) || [];
      if (currentSelections.includes(value)) {
        setAnswers({
          ...answers,
          [currentQuestion.id]: currentSelections.filter((v) => v !== value),
        });
      } else {
        setAnswers({
          ...answers,
          [currentQuestion.id]: [...currentSelections, value],
        });
      }
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: value });
    }
  };

  const isOptionSelected = (value: string) => {
    const answer = answers[currentQuestion.id];
    if (Array.isArray(answer)) {
      return answer.includes(value);
    }
    return answer === value;
  };

  const canProceed = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.multiSelect) {
      return true; // Multi-select is optional
    }
    return !!answer;
  };

  const calculateRecommendations = () => {
    const productScores: Record<string, { score: number; reasons: string[] }> = {};

    // Calculate scores based on all answers
    Object.entries(answers).forEach(([questionId, answer]) => {
      const values = Array.isArray(answer) ? answer : [answer];
      values.forEach((value) => {
        const products = productMappings[value] || [];
        products.forEach((productId, index) => {
          if (!productScores[productId]) {
            productScores[productId] = { score: 0, reasons: [] };
          }
          // Primary goal gets higher weight
          const weight = questionId === "primary_goal" ? 3 : questionId === "secondary_goals" ? 2 : 1;
          productScores[productId].score += weight * (products.length - index);
          
          if (goalReasons[value] && !productScores[productId].reasons.includes(goalReasons[value])) {
            productScores[productId].reasons.push(goalReasons[value]);
          }
        });
      });
    });

    // Convert to recommendations array and sort by score
    const recs: ProductRecommendation[] = Object.entries(productScores)
      .map(([productId, { score, reasons }]) => {
        const product = productDetails[productId];
        if (!product) return null;
        return {
          id: productId,
          name: product.name,
          image: product.image,
          price: product.price,
          reason: reasons.slice(0, 2).join(" and "),
          matchScore: Math.min(Math.round((score / 15) * 100), 100),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.matchScore - a!.matchScore)
      .slice(0, 4) as ProductRecommendation[];

    setRecommendations(recs);
    setShowResults(true);
  };

  const handleNext = () => {
    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateRecommendations();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddToCart = (product: ProductRecommendation) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: "Supplements",
    });
  };

  const handleAddAllToCart = () => {
    recommendations.forEach((product) => {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: "Supplements",
      });
    });
    toast.success("All recommended products added to cart!");
  };

  const totalPrice = recommendations.reduce((sum, p) => sum + p.price, 0);

  return (
    <>
      <SEOHead
        title="Wellness Quiz - Find Your Perfect Supplements | Healios"
        description="Take our personalized wellness quiz to discover the perfect supplements for your health goals. Get custom recommendations based on your lifestyle and needs."
        canonicalUrl="https://healios.shop/wellness-quiz"
      />
      <Header />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          {!showResults ? (
            <>
              {/* Progress */}
              <div className="mb-8">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Question {currentStep + 1} of {quizQuestions.length}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Question */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif text-foreground mb-2">
                  {currentQuestion.question}
                </h1>
                {currentQuestion.multiSelect && (
                  <p className="text-muted-foreground">Select all that apply</p>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {currentQuestion.options.map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isOptionSelected(option.value)
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-accent/50"
                    }`}
                    onClick={() => handleSelectOption(option.value)}
                  >
                    <CardContent className="p-6 text-center">
                      <span className="text-3xl mb-3 block">{option.icon}</span>
                      <span className="font-medium text-foreground">{option.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNext} disabled={!canProceed()}>
                  {currentStep === quizQuestions.length - 1 ? (
                    <>
                      See My Results
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            /* Results */
            <div className="animate-in fade-in duration-500">
              <div className="text-center mb-10">
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-serif text-foreground mb-3">
                  Your Personalized Wellness Stack
                </h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                  Based on your answers, we've curated the perfect combination of supplements to support your wellness journey.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {recommendations.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-accent/30 flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                        <div className="flex-1 py-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-foreground">{product.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Perfect {product.reason}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-primary">
                                {product.matchScore}% match
                              </div>
                              <div className="font-semibold text-foreground">
                                £{product.price.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mr-4"
                          onClick={() => handleAddToCart(product)}
                        >
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium text-foreground">Complete Stack</h3>
                      <p className="text-sm text-muted-foreground">
                        Get all {recommendations.length} products
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-foreground">
                        £{totalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" size="lg" onClick={handleAddAllToCart}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Add All to Cart
                  </Button>
                </CardContent>
              </Card>

              <div className="mt-8 text-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowResults(false);
                    setCurrentStep(0);
                    setAnswers({});
                  }}
                >
                  Retake Quiz
                </Button>
                <Button
                  variant="link"
                  onClick={() => navigate("/category/shop")}
                >
                  Browse All Products
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default WellnessQuiz;
