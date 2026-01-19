export default function TitlePage({ kicker, title, className = '', aos = true, variant = 'default' }) {
  const aosProps = aos ? {
    'data-aos': 'fade-up',
    'data-aos-duration': '800'
  } : {};

  // Variante "accent" con barra laterale colorata
  if (variant === 'accent') {
    return (
      <div className={`section-accent-title ${className}`} {...aosProps}>
        <div className="section-accent-bar" aria-hidden="true"></div>
        <div>
          {kicker && <p className="section-accent-kicker">{kicker}</p>}
          <h1 className="section-accent-headline">{title}</h1>
        </div>
      </div>
    );
  }

  // Variante default con bordo sinistro - IDENTICO a FeaturedCities
  return (
    <div className={`section-title ${className}`} {...aosProps}>
      {kicker && <h3>{kicker}</h3>}
      <h2>{title}</h2>
    </div>
  );
}
