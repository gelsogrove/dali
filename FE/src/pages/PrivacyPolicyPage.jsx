import SEO from '../components/SEO';
import PageHero from '../components/PageHero';
import './PrivacyPolicyPage.css';

export default function PrivacyPolicyPage() {
  return (
    <>
      <SEO 
        title="Privacy Policy | Buy With Dali"
        description="Privacy Policy for Buy With Dali - Real Estate in Riviera Maya. Learn how we protect and use your personal information."
        keywords="privacy policy, data protection, personal information"
        canonicalUrl="https://buywithdali.com/privacy-policy"
      />
      <PageHero breadcrumb="» Privacy Policy" />
      
      <section className="privacy-policy-section">
        <div className="privacy-policy-container">
          <div className="privacy-policy-content">
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last Updated: January 2026</p>

            <div className="policy-section">
              <h2>1. Introduction</h2>
              <p>
                Buy With Dali ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and otherwise process personal information in connection with our website, services, and interactions with you.
              </p>
            </div>

            <div className="policy-section">
              <h2>2. Information We Collect</h2>
              <p>We may collect information about you in the following ways:</p>
              <ul>
                <li><strong>Contact Information:</strong> Name, email address, phone number, mailing address</li>
                <li><strong>Property Information:</strong> Preferences, budget, timeline, property interests</li>
                <li><strong>Account Information:</strong> Username, password, profile details</li>
                <li><strong>Technical Information:</strong> IP address, browser type, pages visited, referring URL</li>
                <li><strong>Communication Data:</strong> Messages, inquiries, and correspondence</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>3. How We Use Your Information</h2>
              <p>We use collected information for the following purposes:</p>
              <ul>
                <li>Providing real estate services and property information</li>
                <li>Processing inquiries and communication requests</li>
                <li>Scheduling appointments and consultations</li>
                <li>Sending marketing communications (with your consent)</li>
                <li>Improving our website and services</li>
                <li>Complying with legal obligations</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>4. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </div>

            <div className="policy-section">
              <h2>5. Information Sharing</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share information with:
              </p>
              <ul>
                <li>Service providers who assist us in operating our website</li>
                <li>Legal authorities when required by law</li>
                <li>Business partners for legitimate business purposes (with consent)</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>6. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to enhance your experience on our website. You can control cookie preferences through your browser settings.
              </p>
            </div>

            <div className="policy-section">
              <h2>7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Data portability</li>
              </ul>
            </div>

            <div className="policy-section">
              <h2>8. Third-Party Links</h2>
              <p>
                Our website may contain links to third-party websites. We are not responsible for the privacy practices of external sites. Please review their privacy policies before providing your information.
              </p>
            </div>

            <div className="policy-section">
              <h2>9. Children's Privacy</h2>
              <p>
                Our services are not directed to children under the age of 13. We do not knowingly collect personal information from children. If we learn we have collected information from a child under 13, we will delete such information promptly.
              </p>
            </div>

            <div className="policy-section">
              <h2>10. Updates to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on our website and updating the "Last Updated" date. Your continued use of our services constitutes acceptance of the updated policy.
              </p>
            </div>

            <div className="policy-section">
              <h2>11. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="contact-info">
                <p><strong>Buy With Dali</strong></p>
                <p>Email: <a href="mailto:dalila@buywithdali.com">dalila@buywithdali.com</a></p>
                <p>Phone: <a href="tel:+525213046360">+52 (521) 304-6360</a></p>
                <p>Location: Playa del Carmen, Riviera Maya, Mexico</p>
              </div>
            </div>

            <div className="policy-footer">
              <p>© 2026 Buy With Dali. All rights reserved.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
