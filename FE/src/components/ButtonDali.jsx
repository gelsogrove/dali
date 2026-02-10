import { Link } from 'react-router-dom';

export default function ButtonDali({
  children,
  href,
  to,
  onClick,
  className = '',
  target,
  rel,
  type = 'button',
  disabled = false,
  ariaBusy,
}) {
  const baseClass = 'button-dali';
  const combinedClass = `${baseClass} ${className}`.trim();

  if (to) {
    return (
      <Link 
        to={to} 
        className={combinedClass}
        onClick={disabled ? undefined : onClick}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
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
        onClick={disabled ? (event) => event.preventDefault() : onClick}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
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
      disabled={disabled}
      aria-busy={ariaBusy}
    >
      {children}
    </button>
  );
}
