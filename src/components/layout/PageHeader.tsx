interface PageHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

const PageHeader = ({ 
  title, 
  subtitle, 
  centered = false,
  className = '' 
}: PageHeaderProps) => {
  return (
    <header className={`mb-8 ${centered ? 'text-center' : ''} ${className}`}>
      <h1 className="text-3xl font-light text-foreground mb-2">
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground">
          {subtitle}
        </p>
      )}
    </header>
  );
};

export default PageHeader;
