const Container = ({ children, className = '', size = 'default' }) => {
  const sizes = {
    default: 'max-w-[1600px]',
    sm: 'max-w-5xl',
    lg: 'max-w-[1800px]',
    full: 'max-w-full',
  };

  return (
    <div className={`${sizes[size]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
};

export default Container;
