import { Link } from 'react-router-dom';

export default function ButtonDali({ children, href, to, onClick, className = '', target, rel, type = 'button' }) {
  const baseClass = 'button-dali';
  const combinedClass = `${baseClass} ${className}`.trim();

  if (to) {
    return (
      <Link 
        to={to} 
        className={combinedClass}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a 
        href={href} 
        className={combinedClass}
        target={target}
        rel={rel}
        onClick={onClick}
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
