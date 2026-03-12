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
    <section className={`mb-xl ${className}`}>
      {title && (
        <h2 className="text-xl font-medium text-foreground mb-md uppercase tracking-widest">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
};

export default SectionContainer;
