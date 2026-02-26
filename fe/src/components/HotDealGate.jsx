import { useState, useEffect } from 'react';
import { api } from '../config/api';
import './HotDealGate.css';

/**
 * HotDealGate - Blocks access to hot deal property details.
 * Public sees images, title, subtitle, video. Other details are hidden unless unlocked.
 */
export default function HotDealGate({ propertyId, children, onUnlock }) {
  const globalStorageKey = 'hot_deal_access';

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const [codeValue, setCodeValue] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    message: 'I would like an access code to view Hot Deals.',
  });

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(globalStorageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expires_at && new Date(parsed.expires_at).getTime() > Date.now()) {
          setIsUnlocked(true);
        } else {
          localStorage.removeItem(globalStorageKey);
        }
      } catch {
        localStorage.removeItem(globalStorageKey);
      }
    }
  }, []);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!codeValue.trim()) return;

    setIsVerifying(true);
    setCodeError('');

    try {
      // Re-using the same verify endpoint as PropertyAccessGate
      const response = await api.post('/access-requests/verify-code', {
        code: codeValue.trim().toUpperCase(),
      });

      if (response.success) {
        localStorage.setItem(globalStorageKey, JSON.stringify({
          code: codeValue.trim().toUpperCase(),
          expires_at: response.data.expires_at,
          granted_at: new Date().toISOString(),
        }));
        setIsUnlocked(true);
        if (onUnlock) {
          onUnlock();
        }
      } else {
        setCodeError(response.error || 'Invalid or expired code');
      }
    } catch (err) {
      setCodeError('Invalid or expired access code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/access-requests', {
        ...formData,
        property_id: propertyId,
      });
      if (res?.success) {
        setShowRequestForm(false);
        setShowThankYou(true);
      } else {
        setCodeError(res?.error || 'Request failed, please try again.');
      }
    } catch (err) {
      setCodeError('Request failed, please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUnlocked) {
    return children;
  }

  return (
    <div className="hot-deal-gate-container" data-aos="fade-up" data-aos-duration="900" data-aos-delay="100">
      <div className="hot-deal-gate-card">
        <div className="gate-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {showCodeInput && !showRequestForm && !showThankYou && (
          <div className="gate-mode-content">
            <h2>Exclusive Hot Deal</h2>
            <p className="gate-description">
              The full details for this property (Price, Location, Full Description, and Amenities) are reserved for clients with an access code.
            </p>
            <form onSubmit={handleVerifyCode}>
              <div className="gate-code-wrapper">
                <input
                  type="text"
                  value={codeValue}
                  onChange={(e) => {
                    setCodeValue(e.target.value.toUpperCase().slice(0, 6));
                    setCodeError('');
                  }}
                  placeholder="ABC123"
                  maxLength={6}
                  className="gate-code-input"
                  autoFocus
                />
              </div>
              {codeError && <p className="gate-error">{codeError}</p>}
              <button
                type="submit"
                className="gate-btn gate-btn-primary"
                disabled={isVerifying || codeValue.length < 6}
              >
                {isVerifying ? 'Verifying...' : 'Unlock Information'}
              </button>
            </form>
            <div className="gate-footer">
              <p>Don't have a code?</p>
              <button className="gate-btn-link" onClick={() => setShowRequestForm(true)}>Request an Access Code</button>
            </div>
          </div>
        )}

        {showRequestForm && !showThankYou && (
          <div className="gate-mode-content request-mode">
            <h2>Request Access</h2>
            <p className="gate-description">
              Fill in your details and we'll send you an access code to view full details of our exclusive Hot Deals.
            </p>
            <form onSubmit={handleSubmitRequest} className="gate-request-form">
              <div className="form-row">
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                  placeholder="First Name *"
                  className="gate-input"
                />
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  required
                  placeholder="Last Name *"
                  className="gate-input"
                />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="Email Address *"
                className="gate-input"
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone Number (optional)"
                className="gate-input"
              />
              {codeError && <p className="gate-error">{codeError}</p>}
              <button
                type="submit"
                className="gate-btn gate-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Request Code'}
              </button>
              <button
                type="button"
                className="gate-btn-link gate-back-btn"
                onClick={() => {
                  setShowRequestForm(false);
                  setCodeError('');
                }}
              >
                ← I already have a code
              </button>
            </form>
          </div>
        )}

        {showThankYou && (
          <div className="gate-mode-content thank-you-mode">
            <div className="gate-icon-success">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Request Submitted!</h2>
            <p className="gate-description">
              Thank you for your interest. We'll review your request and send you an access code as soon as possible.
            </p>
            <button
              className="gate-btn gate-btn-primary"
              onClick={() => {
                setShowThankYou(false);
                setShowCodeInput(true);
              }}
            >
              Back to Code Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
