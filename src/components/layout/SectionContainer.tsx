import { ReactNode } from 'react';

interface SectionContainerProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

const SectionContainer = ({ 
  title, 
  children, 
  className = '' 
}: SectionContainerProps) => {
  return (
    <section className={`mb-12 ${className}`}>
      {title && (
        <h2 className="text-xl font-light text-foreground mb-6">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
};

export default SectionContainer;
