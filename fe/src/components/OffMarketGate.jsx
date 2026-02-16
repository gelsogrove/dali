import { useState, useEffect } from 'react';
import { api } from '../config/api';
import './OffMarketGate.css';

/**
 * OffMarketGate - Blocks access to off-market property pages unless user has valid token + code.
 * Now supports global session access via 'off_market_session' storage key.
 */
export default function OffMarketGate({ token, propertyId, slug, children }) {
  const globalStorageKey = 'off_market_session';
  const propertyStorageKey = propertyId ? `off_market_${propertyId}` : null;

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
    // 1a. Check Global Session first
    const globalStored = localStorage.getItem(globalStorageKey);
    if (globalStored) {
      try {
        const parsed = JSON.parse(globalStored);
        if (parsed.expires_at && new Date(parsed.expires_at).getTime() > Date.now()) {
          setIsVerified(true);
          setIsCheckingToken(false);
          return;
        } else {
          localStorage.removeItem(globalStorageKey);
        }
      } catch {
        localStorage.removeItem(globalStorageKey);
      }
    }

    // 1b. Check Property-specific access if applicable
    if (propertyStorageKey) {
      const propertyStored = localStorage.getItem(propertyStorageKey);
      if (propertyStored) {
        try {
          const parsed = JSON.parse(propertyStored);
          if (parsed.expires_at && new Date(parsed.expires_at).getTime() > Date.now()) {
            setIsVerified(true);
            setIsCheckingToken(false);
            return;
          } else {
            localStorage.removeItem(propertyStorageKey);
          }
        } catch {
          localStorage.removeItem(propertyStorageKey);
        }
      }
    }

    // Step 2: Validate token with backend if no existing access and token provided
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
  }, [token, propertyStorageKey]);

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
        // ALWAYS grant global session as per requirements
        localStorage.setItem(globalStorageKey, JSON.stringify({
          token: token,
          expires_at: response.data.expires_at,
          granted_at: new Date().toISOString(),
        }));

        // Also store property-specific access if it was for a specific property
        if (response.data.property_id) {
          localStorage.setItem(`off_market_${response.data.property_id}`, JSON.stringify({
            token: token,
            expires_at: response.data.expires_at,
            granted_at: new Date().toISOString(),
          }));
        }

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

  // Verified → show children
  if (isVerified) {
    return children;
  }

  // No EXISTING access (verified or local)

  // CASE 1: No token in URL → Show "Private Access" but no input
  if (!token) {
    return (
      <section className="off-market-gate">
        <div className="off-market-gate-container">
          <div className="off-market-gate-card">
            <div className="gate-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2>Private Access</h2>
            <p className="gate-description">
              This gallery is reserved for Dali Exclusive clients. Access is provided via direct invitation only.
            </p>
            <div className="gate-footer" style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '20px' }}>
              <p>Requested access? <a href="/contact-us">Contact us</a></p>
              <a href="/" className="gate-btn gate-btn-primary" style={{ marginTop: '15px', display: 'inline-block' }}>
                Back to Public Site
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // CASE 2: Token is invalid (and no session)
  if (!tokenValid && !tokenExpired) {
    return (
      <section className="off-market-gate">
        <div className="off-market-gate-container">
          <div className="off-market-gate-card">
            <div className="gate-icon gate-icon-expired">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2>Invalid Invite</h2>
            <p>The invite link you followed is invalid or has been revoked.</p>
            <a href="/" className="gate-btn gate-btn-primary" style={{ marginTop: '20px' }}>
              Back to Home
            </a>
          </div>
        </div>
      </section>
    );
  }

  // CASE 3: Token expired
  if (tokenExpired) {
    return (
      <section className="off-market-gate">
        <div className="off-market-gate-container">
          <div className="off-market-gate-card">
            <div className="gate-icon gate-icon-expired">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h2>Invite Expired</h2>
            <p>This invite link has expired (72h limit). Please contact your agent for a new one.</p>
            <a href="/contact-us" className="gate-btn gate-btn-primary">
              Request New Access
            </a>
          </div>
        </div>
      </section>
    );
  }

  // CASE 4: Valid token → show code input
  return (
    <section className="off-market-gate">
      <div className="off-market-gate-container">
        <div className="off-market-gate-card">
          <div className="gate-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2>Private Access</h2>
          {propertyTitle && propertyTitle !== 'Global Session' && (
            <p className="gate-property-title">{propertyTitle}</p>
          )}
          {propertyTitle === 'Global Session' && (
            <p className="gate-property-title">Dali Exclusive Database</p>
          )}
          <p className="gate-description">
            Enter your 6-character access code to unlock this private collection.
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
              {isVerifying ? 'Verifying...' : 'Unlock Database'}
            </button>
          </form>
          <p className="gate-footer">
            Don't have a code? <a href="/contact-us">Contact us</a> for private access.
          </p>
        </div>
      </div>
    </section>
  );
}


