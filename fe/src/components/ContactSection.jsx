import { useState } from 'react';
import CanvasImage from './CanvasImage';
import ButtonDali from './ButtonDali';
import { api } from '../config/api';

export default function ContactSection() {
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }
    const formData = new FormData(form);
    const payload = {
      firstName: String(formData.get('first-name') || '').trim(),
      lastName: String(formData.get('last-name') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      message: String(formData.get('message') || '').trim(),
      company: String(formData.get('company') || '').trim(),
      page: window.location.href,
      ts: formStartedAt,
      source: 'get-in-touch',
    };

    setIsSubmitting(true);
    setStatus({ type: 'sending', message: 'Sending...' });

    try {
      await api.post('/contact', payload);
      form.reset();
      setFormStartedAt(Date.now());
      setStatus({ type: 'success', message: "Message sent. We'll get back to you soon." });
    } catch (error) {
      console.error('Contact form error', error);
      setStatus({ type: 'error', message: 'Error sending message. Please try again later.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="git">
      <div className="git-container">
        <div className="git-bg">
          <CanvasImage src="/images/git-bg-new.jpg" width={1600} height={750} className="lazyload" />
        </div>
        <div className="git-content">
          <div className="git-title section-title">
            <h3>Contact Us</h3>
            <h2>Get In Touch</h2>
          </div>
          
          <div className="git-form-container">
            <form className="git-form" onSubmit={handleSubmit}>
              <div className="form-honeypot" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input id="company" name="company" type="text" tabIndex="-1" autoComplete="off" />
              </div>
              <div className="r">
                <div className="c">
                  <label htmlFor="first-name">First Name</label>
                  <input id="first-name" name="first-name" type="text" placeholder="First Name" autoComplete="given-name" minLength={2} maxLength={100} required />
                </div>
                <div className="c">
                  <label htmlFor="last-name">Last Name</label>
                  <input id="last-name" name="last-name" type="text" placeholder="Last Name" autoComplete="family-name" minLength={2} maxLength={100} required />
                </div>
              </div>
              <div className="r">
                <div className="c">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" placeholder="Email" autoComplete="email" maxLength={254} required />
                </div>
                <div className="c">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" type="tel" placeholder="Phone" autoComplete="tel" inputMode="tel" pattern="[0-9+()\\-\\s]*" maxLength={40} />
                </div>
              </div>
              <div className="r message">
                <div className="c">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows="5" placeholder="Message" autoComplete="off" maxLength={2000}></textarea>
                </div>
              </div>
              <ButtonDali type="submit" disabled={isSubmitting} ariaBusy={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send'}
              </ButtonDali>
              {status.message && (
                <div className={`form-status form-status--${status.type}`} role="status" aria-live="polite">
                  {status.message}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
