/**
 * HowTo Schema (JSON-LD) for SEO
 * Enables How-To rich results in Google for product usage instructions
 */

interface HowToSchemaProps {
  name: string;
  description: string;
  steps: string[];
  totalTime?: string; // ISO 8601 duration format, e.g., "PT5M" for 5 minutes
  image?: string;
}

const HowToSchema = ({ name, description, steps, totalTime, image }: HowToSchemaProps) => {
  if (!steps || steps.length === 0) return null;

  const howToSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "text": step
    }))
  };

  if (totalTime) {
    howToSchema.totalTime = totalTime;
  }

  if (image) {
    howToSchema.image = image.startsWith('http') 
      ? image 
      : `https://www.thehealios.com${image}`;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
    />
  );
};

export default HowToSchema;
