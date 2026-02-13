import PageHero from '../components/PageHero';

export default function ListWithDaliPage() {
  return (
    <>
      <PageHero breadcrumb="» List With Dali" />

      <section className="lwd-intro">
        <div className="lwd-intro-inner">
          <div className="fp-title section-title">
            <strong>Sell with confidence</strong>
            <h2>List with Dali</h2>
          </div>
        </div>
      </section>

      <section className="lwd-content">
        <div className="lwd-wrapper">
          <div className="lwd-copy">
            <h2>Why sell with Dali?</h2>
            <ul>
              <li>Strategic pricing and staging direction to maximize your return.</li>
              <li>Professional creative: photography, video, and digital campaigns across premium channels.</li>
              <li>Direct network of vetted buyers and investors seeking Riviera Maya opportunities.</li>
              <li>Hands-on coordination of showings, negotiations, and closing milestones.</li>
            </ul>
            <div className="lwd-metrics">
              <div>
                <strong>8+ years</strong>
                <span>Local market expertise</span>
              </div>
              <div>
                <strong>Concierge</strong>
                <span>White-glove seller support</span>
              </div>
              <div>
                <strong>Bespoke</strong>
                <span>Marketing plan for each property</span>
              </div>
            </div>
          </div>

          <div className="lwd-form-card">
            <div className="lwd-form-head">
              <p className="lwd-form-kicker">Start here</p>
              <h3>Tell us about your property</h3>
              <p className="lwd-form-sub">We’ll schedule a call and craft your selling plan.</p>
            </div>
            <form className="lwd-form">
              <div className="lwd-field">
                <label>Name *</label>
                <input type="text" name="name" placeholder="Your name" />
              </div>
              <div className="lwd-field-grid">
                <div className="lwd-field">
                  <label>Email *</label>
                  <input type="email" name="email" placeholder="you@email.com" />
                </div>
                <div className="lwd-field">
                  <label>Phone *</label>
                  <input type="tel" name="phone" placeholder="+52 ..." />
                </div>
              </div>
              <div className="lwd-field">
                <label>Address</label>
                <input type="text" name="address" placeholder="Street address" />
              </div>
              <div className="lwd-field-grid">
                <div className="lwd-field">
                  <label>City</label>
                  <input type="text" name="city" placeholder="City" />
                </div>
                <div className="lwd-field">
                  <label>State</label>
                  <input type="text" name="state" placeholder="State" />
                </div>
                <div className="lwd-field">
                  <label>Zip</label>
                  <input type="text" name="zip" placeholder="Zip" />
                </div>
              </div>
              <div className="lwd-field-grid">
                <div className="lwd-field">
                  <label>Property type</label>
                  <input type="text" name="propertyType" placeholder="Condo, villa, etc." />
                </div>
                <div className="lwd-field">
                  <label>Bedrooms</label>
                  <input type="text" name="beds" placeholder="3" />
                </div>
                <div className="lwd-field">
                  <label>Bathrooms</label>
                  <input type="text" name="baths" placeholder="2" />
                </div>
              </div>
              <div className="lwd-field-grid">
                <div className="lwd-field">
                  <label>Approx. size</label>
                  <input type="text" name="sqft" placeholder="Square footage" />
                </div>
                <div className="lwd-field">
                  <label>Preferred contact</label>
                  <input type="text" name="contact" placeholder="Phone or email" />
                </div>
                <div className="lwd-field">
                  <label>Date to move</label>
                  <input type="text" name="datemove" placeholder="Month / Year" />
                </div>
              </div>
              <div className="lwd-field">
                <label>Tell us about your property</label>
                <textarea name="comments" rows="4" placeholder="Upgrades, timeline, or questions"></textarea>
              </div>
              <button type="button" className="default-button lwd-submit">Submit</button>
              <p className="lwd-note">Form is for design only; please call or email to list now.</p>
            </form>
          </div>
        </div>
      </section>

    </>
  );
}
