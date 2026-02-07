const SectionHeading = ({
  subtitle,
  title,
  description,
  align = 'center',
  className = '',
}) => {
  const alignClass = {
    center: 'text-center',
    left: 'text-left',
    right: 'text-right',
  };

  return (
    <div className={`max-w-2xl ${align === 'center' ? 'mx-auto' : ''} ${alignClass[align]} ${className}`}>
      {subtitle && (
        <p className="text-primary font-medium text-sm uppercase tracking-wider mb-3">
          {subtitle}
        </p>
      )}
      {title && (
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-dark leading-tight mb-4">
          {title}
        </h2>
      )}
      {description && (
        <p className="text-muted text-base leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
