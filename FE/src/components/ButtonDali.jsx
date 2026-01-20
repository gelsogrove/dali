export default function ButtonDali({ children, href, onClick, className = '', target, rel, type = 'button' }) {
  const baseClass = 'button-dali';
  const combinedClass = `${baseClass} ${className}`.trim();

  if (href) {
    return (
      <a 
        href={href} 
        className={combinedClass}
        target={target}
        rel={rel}
      >
        {children}
      </a>
    );
  }

  return (
    <button 
      type={type}
      onClick={onClick} 
      className={combinedClass}
    >
      {children}
    </button>
  );
}
