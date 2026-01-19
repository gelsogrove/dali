import PageHero from '../components/PageHero';
import ContactSection from '../components/ContactSection';

const steps = [
  { title: 'Define your vision', text: 'Share your goals, budget, and timeline so we can tailor the search.' },
  { title: 'Choose the right area', text: 'Cancún, Playa del Carmen, Tulum—get guidance on the best fit for lifestyle and returns.' },
  { title: 'Tour & shortlist', text: 'We arrange curated visits (in person or virtual) to compare top options.' },
  { title: 'Negotiate & close', text: 'From offer to closing, we manage details and keep you informed at every step.' },
];

export default function BuyersGuidePage() {
  return (
    <>
      <PageHero breadcrumb="» Buyer's Guide" />

      <section className="buyers-hero">
        <div className="buyers-hero-inner">
          <div className="buyers-accent-bar" aria-hidden="true"></div>
          <div>
            <p className="buyers-eyebrow">Buyer’s guide</p>
            <h1>Find your perfect home in Riviera Maya</h1>
            <p className="buyers-hero-copy">
              Practical steps, local insights, and concierge support to make purchasing seamless—whether you’re relocating, investing, or choosing a vacation home.
            </p>
          </div>
        </div>
      </section>

      <section className="buyers-steps">
        <div className="buyers-steps-wrapper">
          {steps.map((step) => (
            <div className="buyers-step-card" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="buyers-cta">
        <div className="buyers-cta-wrapper">
          <div className="buyers-cta-text">
            <p className="buyers-eyebrow">Ready to begin?</p>
            <h2>Let’s map your ideal property path</h2>
            <p>We’ll outline options, financing considerations, and the best neighborhoods for your goals.</p>
          </div>
          <div className="buyers-cta-actions">
            <a href="https://calendar.app.google/QoV7AeK9d3B62hqm7" className="default-button" target="_blank" rel="noopener noreferrer">
              Schedule a Call
            </a>
            <a href="/search" className="default-button ghost">
              Start Searching
            </a>
          </div>
        </div>
      </section>

      <ContactSection />
    </>
  );
}
