import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: 'content' | 'standard' | 'wide';
  className?: string;
}

const maxWidthClasses = {
  content: 'max-w-4xl',
  standard: 'max-w-6xl',
  wide: 'max-w-7xl',
};

const PageContainer = ({ 
  children, 
  maxWidth = 'standard',
  className = '' 
}: PageContainerProps) => {
  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto px-page py-[var(--space-xl)] ${className}`}>
      {children}
    </div>
  );
};

export default PageContainer;
