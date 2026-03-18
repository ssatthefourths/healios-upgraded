interface ContentSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const ContentSection = ({ title, children, className = "" }: ContentSectionProps) => {
  return (
    <section className={`py-[var(--space-md)] border-b border-border last:border-b-0 ${className}`}>
      {title && (
        <h2 className="text-2xl font-light text-foreground mb-6">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
};

export default ContentSection;