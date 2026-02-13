import { useState, useEffect } from 'react';
import { api } from '../config/api';
import './OffMarketGate.css';

/**
 * OffMarketGate - Blocks access to off-market property pages unless user has valid token + code.
 * 
 * Flow:
 * 1. User arrives at /listings/slug?token=ABC
 * 2. Check localStorage for existing valid access
 * 3. If not, show code entry popup
 * 4. Valid code → localStorage saves access for 7 days
 * 5. Expired/no token → "Property not found"
 */
export default function OffMarketGate({ token, propertyId, slug, children }) {
  const storageKey = `off_market_${propertyId}`;
  const [isVerified, setIsVerified] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [propertyTitle, setPropertyTitle] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Step 1: Check localStorage for existing access
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expires_at && new Date(parsed.expires_at).getTime() > Date.now()) {
          setIsVerified(true);
          setIsCheckingToken(false);
          return;
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    // Step 2: Validate token with backend
    if (!token) {
      setIsCheckingToken(false);
      return;
    }

    const checkToken = async () => {
      try {
        const response = await api.get(`/off-market-invites/check-token?token=${encodeURIComponent(token)}`);
        if (response.success && response.data) {
          setTokenValid(!response.data.expired);
          setTokenExpired(response.data.expired);
          setPropertyTitle(response.data.property_title || '');
        }
      } catch {
        setTokenValid(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkToken();
  }, [token, storageKey]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!codeValue.trim() || !token) return;

    setIsVerifying(true);
    setCodeError('');

    try {
      const response = await api.post('/off-market-invites/verify', {
        token: token,
        code: codeValue.trim().toUpperCase(),
      });

      if (response.success && response.data) {
        localStorage.setItem(storageKey, JSON.stringify({
          token: token,
          expires_at: response.data.expires_at,
          granted_at: new Date().toISOString(),
        }));
        setIsVerified(true);
      } else {
        setCodeError(response.error || 'Invalid or expired code');
      }
    } catch (err) {
      setCodeError('Invalid or expired access code');
    } finally {
      setIsVerifying(false);
    }
  };

  // Loading state
  if (isCheckingToken) {
    return (
      <section className="off-market-gate">
        <div className="off-market-gate-container">
          <div className="off-market-gate-loading">
            <div className="off-market-spinner" />
            <p>Verifying access...</p>
          </div>
        </div>
      </section>
    );
  }

  // Verified → show property
  if (isVerified) {
    return children;
  }

  // No token or invalid token → "not found"
  if (!token || (!tokenValid && !tokenExpired)) {
    return null; // Let parent handle notFound state
  }

  // Token expired
  if (tokenExpired) {
    return (
      <section className="off-market-gate">
        <div className="off-market-gate-container">
          <div className="off-market-gate-card">
            <div className="gate-icon gate-icon-expired">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h2>Invite Expired</h2>
            <p>This invite link has expired. Please contact us to request a new one.</p>
            <a href="/contact-us" className="gate-btn gate-btn-primary">
              Contact Us
            </a>
          </div>
        </div>
      </section>
    );
  }

  // Valid token → show code input
  return (
    <section className="off-market-gate">
      <div className="off-market-gate-container">
        <div className="off-market-gate-card">
          <div className="gate-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2>Private Listing</h2>
          {propertyTitle && (
            <p className="gate-property-title">{propertyTitle}</p>
          )}
          <p className="gate-description">
            Enter your 6-character access code to view this exclusive property.
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
            {codeError && (
              <p className="gate-error">{codeError}</p>
            )}
            <button
              type="submit"
              className="gate-btn gate-btn-primary"
              disabled={isVerifying || codeValue.length < 6}
            >
              {isVerifying ? 'Verifying...' : 'Access Property'}
            </button>
          </form>
          <p className="gate-footer">
            Don't have a code? <a href="/contact-us">Contact us</a> to request access.
          </p>
        </div>
      </div>
    </section>
  );
}
