export default function WhatsAppFloat() {
  const whatsappUrl = "https://chat.whatsapp.com/JTvrGRfQ7ANC0DtqlxLDc";

  return (
    <div className="whatsapp-float">
      <a 
        href={whatsappUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Join our WhatsApp Hub"
      >
        <span className="wh-text">WhatsApp Hub</span>
        <div className="wh-icon">
          <svg 
            width="28" 
            height="28" 
            viewBox="0 0 24 24" 
            fill="white" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12.01 2c-5.52 0-10 4.48-10 10 0 1.76.46 3.41 1.27 4.84l-1.27 4.67 4.8-.93c1.4.78 2.99 1.22 4.7 1.22 5.52 0 10-4.48 10-10s-4.48-10-10-10zm6.18 14.15c-.25.7-1.44 1.29-2.01 1.34-.51.05-1 .24-3.17-.65-2.61-1.07-4.29-3.72-4.42-3.89-.13-.17-1.07-1.43-1.07-2.73 0-1.31.68-1.95.92-2.21.25-.26.54-.33.72-.33.18 0 .36.01.52.01.17 0 .39-.06.61.47.22.53.76 1.83.82 1.96.06.13.11.28 0 .49-.1.21-.16.35-.31.53-.15.18-.32.4-.46.54-.15.15-.31.31-.13.61.18.3.79 1.29 1.69 2.09.77.68 1.42.89 1.72 1.04.3.15.48.13.66-.02.18-.21.78-.9.99-1.21.21-.31.42-.26.7-.15.28.1.1.78 1.82 2.64.91 1.05.05.11.1.25.1.48s-.59.7-.84.95z"/>
          </svg>
        </div>
      </a>
    </div>
  );
}
