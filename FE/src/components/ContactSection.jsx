import { useState } from 'react';
import CanvasImage from './CanvasImage';
import { contactInfo } from '../data/homeData';
import ButtonDali from './ButtonDali';

export default function ContactSection() {
  const [status, setStatus] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus('Thanks for reaching out! We will contact you shortly.');
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
              <div className="r">
                <div className="c">
                  <label htmlFor="first-name">First Name</label>
                  <input id="first-name" name="first-name" type="text" placeholder="First Name" required />
                </div>
                <div className="c">
                  <label htmlFor="last-name">Last Name</label>
                  <input id="last-name" name="last-name" type="text" placeholder="Last Name" required />
                </div>
              </div>
              <div className="r">
                <div className="c">
                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" placeholder="Email" required />
                </div>
                <div className="c">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" type="tel" placeholder="Phone" />
                </div>
              </div>
              <div className="r message">
                <div className="c">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" name="message" rows="5" placeholder="Message"></textarea>
                </div>
              </div>
              <ButtonDali type="submit">
                Send
              </ButtonDali>
              {status && <div className="form-status">{status}</div>}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
