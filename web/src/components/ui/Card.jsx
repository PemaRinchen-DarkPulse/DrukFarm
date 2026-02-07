const Card = ({
  children,
  className = '',
  hover = true,
  padding = 'p-6',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl ${padding} ${hover ? 'hover:shadow-xl transition-shadow duration-300' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardImage = ({ src, alt, className = '' }) => (
  <div className={`overflow-hidden rounded-xl ${className}`}>
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
    />
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`mt-4 ${className}`}>{children}</div>
);

Card.Image = CardImage;
Card.Content = CardContent;

export default Card;
