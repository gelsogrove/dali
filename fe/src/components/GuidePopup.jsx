import { useState } from 'react';
import ButtonDali from './ButtonDali';

export default function GuidePopup() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setStatus("Thanks! We'll send you the guide shortly.");
  };

  return (
    <section id="popup" className="popup">
      <div className={`popup-container ${open ? 'full' : ''}`}>
        <div className="popup-primary">
          <div className="popup-close">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                setStatus('');
              }}
            >
              <span className="hidden">close</span>
              <i className="ai-font-x-sign"></i>
            </a>
          </div>
          <div className="popup-title">
            <h3>Real Estate Buyer's Guide</h3>
          </div>
          <div className="popup-form">
            <form onSubmit={handleSubmit}>
              <div className="r">
                <div className="c">
                  <label htmlFor="popup-email">Email</label>
                  <input id="popup-email" type="email" name="email" required />
                </div>
                <div className="c">
                  <label htmlFor="popup-name">Name</label>
                  <input id="popup-name" type="text" name="name" required />
                </div>
                <div className="c">
                  <label htmlFor="popup-lname">Last Name</label>
                  <input id="popup-lname" type="text" name="last-name" required />
                </div>
                <div className="c">
                  <label htmlFor="popup-phone">Phone</label>
                  <input id="popup-phone" type="tel" name="phone" required />
                </div>
              </div>
              <div className="popup-link">
                <ButtonDali type="submit">
                  Real Estate Buyer's Guide
                </ButtonDali>
              </div>
              {status && <div className="wpcf7-response-output" aria-live="polite">{status}</div>}
            </form>
          </div>
          <div className="popup-toggler">
            <div className="popup-link">
              <ButtonDali
                onClick={() => {
                  setOpen(true);
                  setStatus('');
                }}
              >
                Sign Up for a Copy
              </ButtonDali>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
