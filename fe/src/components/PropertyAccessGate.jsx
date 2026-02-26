import { useState, useEffect } from 'react';
import { api } from '../config/api';
import './PropertyAccessGate.css';

/**
 * PropertyAccessGate - Locks attachments behind an access code system for New Developments and Active Properties.
 * 
 * Flow:
 * 1. Show lock icon over attachments
 * 2. Click lock → Show code input popup
 * 3. "Request Access Code" → Show contact form
 * 4. After form submission → Thank you message
 * 5. User enters code → Validates against API
 * 6. Valid code → Unlock attachments for 72 hours (localStorage)
 */
export default function PropertyAccessGate({
  property,
  attachments,
  attachmentIcon,
  formatBytes,
}) {
  const API_BASE = import.meta.env.VITE_API_URL || '';
  const fileUrl = (url) => {
    if (!url) return '#';
    if (url.startsWith('http')) return url;
    // ensure we drop trailing /api if present in VITE_API_URL
    const base = API_BASE.replace(/\/api\/?$/, '');
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };
  const storageKey = 'protected_docs_access';
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
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
    message: `I'm interested in the property "${property.title}"`,
  });

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.expires_at && new Date(parsed.expires_at).getTime() > Date.now()) {
          setIsUnlocked(true);
        } else {
          // Expired - remove
          localStorage.removeItem(storageKey);
        }
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!codeValue.trim()) return;

    setIsVerifying(true);
    setCodeError('');

    try {
      const response = await api.post('/access-requests/verify-code', {
        code: codeValue.trim().toUpperCase(),
      });

      if (response.success) {
        // Store access in localStorage
        localStorage.setItem(storageKey, JSON.stringify({
          code: codeValue.trim().toUpperCase(),
          expires_at: response.data.expires_at,
          granted_at: new Date().toISOString(),
        }));
        setIsUnlocked(true);
        setShowCodeInput(false);
        setCodeValue('');
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
        property_id: property.id,
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

  const closeAllPopups = () => {
    setShowCodeInput(false);
    setShowRequestForm(false);
    setShowThankYou(false);
    setCodeError('');
    setCodeValue('');
  };

  // --- UNLOCKED: Show attachments normally ---
  if (isUnlocked) {
    return (
      <div className="listing-attachments">
        <div className="attachments-header-unlocked">
          <h4>Downloads &amp; Links</h4>
          <span className="unlocked-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
            Access Granted
          </span>
        </div>
        <ul className="attachments-list">
          {attachments.map((file) => {
            const isLink = file.mime_type === 'link' || !file.filename;
            return (
              <li key={file.id} className="attachment-item">
                <span className="attachment-icon" aria-hidden="true">{attachmentIcon(file.filename, file.mime_type)}</span>
                <div className="attachment-meta">
                  <a href={isLink ? file.url : fileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                    {file.title || (isLink ? 'External Link' : file.filename)}
                  </a>
                  {isLink ? (
                    <span className="attachment-info" style={{ color: 'var(--primary-color, #c19a5b)' }}>Visit Link</span>
                  ) : (
                    <span className="attachment-info">
                      {file.filename} {file.size_bytes ? `· ${formatBytes(file.size_bytes)}` : ''}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // --- LOCKED: Show lock overlay ---
  return (
    <>
      <div className="listing-attachments listing-attachments-locked">
        <h4>Documents</h4>
        <div className="locked-overlay" onClick={() => setShowCodeInput(true)}>
          <div className="locked-content">
            <div className="lock-icon-wrapper">
              <svg className="lock-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p className="locked-title">Protected Documents</p>
            <p className="locked-subtitle">{attachments.length} document{attachments.length !== 1 ? 's' : ''} available</p>
            <span className="locked-cta">Click to access</span>
          </div>
          {/* Blurred preview of attachments */}
          <div className="locked-preview">
            {attachments.slice(0, 3).map((file, idx) => (
              <div key={idx} className="locked-preview-item">
                <span>{attachmentIcon(file.filename, file.mime_type)}</span>
                <span className="locked-preview-name">{file.title || file.filename}</span>
              </div>
            ))}
            {attachments.length > 3 && (
              <div className="locked-preview-item">
                <span>📁</span>
                <span className="locked-preview-name">+{attachments.length - 3} more...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup Overlay */}
      {(showCodeInput || showRequestForm || showThankYou) && (
        <div className="access-popup-overlay" onClick={closeAllPopups}>
          <div className="access-popup" onClick={(e) => e.stopPropagation()}>
            <button className="access-popup-close" onClick={closeAllPopups}>×</button>

            {/* Step 1: Code Input */}
            {showCodeInput && !showRequestForm && !showThankYou && (
              <div className="access-popup-content">
                <div className="popup-icon-wrapper">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3>Enter Access Code</h3>
                <p className="popup-description">
                  Enter your 6-character access code to download the documents for this property.
                </p>
                <form onSubmit={handleVerifyCode}>
                  <div className="code-input-wrapper">
                    <input
                      type="text"
                      value={codeValue}
                      onChange={(e) => {
                        setCodeValue(e.target.value.toUpperCase().slice(0, 6));
                        setCodeError('');
                      }}
                      placeholder="ABC123"
                      maxLength={6}
                      className="code-input"
                      autoFocus
                    />
                  </div>
                  {codeError && (
                    <p className="code-error">{codeError}</p>
                  )}
                  <button
                    type="submit"
                    className="popup-btn popup-btn-primary"
                    disabled={isVerifying || codeValue.length < 6}
                  >
                    {isVerifying ? 'Verifying...' : 'Unlock Documents'}
                  </button>
                </form>
                <div className="popup-divider">
                  <span>or</span>
                </div>
                <button
                  className="popup-btn popup-btn-secondary"
                  onClick={() => {
                    setShowCodeInput(false);
                    setShowRequestForm(true);
                  }}
                >
                  Request Access Code
                </button>
              </div>
            )}

            {/* Step 2: Request Form */}
            {showRequestForm && !showThankYou && (
              <div className="access-popup-content">
                <div className="popup-icon-wrapper popup-icon-form">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3>Request Access Code</h3>
                <p className="popup-description">
                  Fill in your details and we'll send you an access code to download the property documents.
                </p>
                <form onSubmit={handleSubmitRequest} className="request-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        required
                        placeholder="John"
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        required
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Message</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <button
                    type="submit"
                    className="popup-btn popup-btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Submit Request'}
                  </button>
                  <button
                    type="button"
                    className="popup-btn popup-btn-text"
                    onClick={() => {
                      setShowRequestForm(false);
                      setShowCodeInput(true);
                    }}
                  >
                    ← I already have a code
                  </button>
                </form>
              </div>
            )}

            {/* Step 3: Thank You */}
            {showThankYou && (
              <div className="access-popup-content access-popup-thankyou">
                <div className="popup-icon-wrapper popup-icon-success">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3>Request Submitted!</h3>
                <p className="popup-description">
                  Thank you for your interest in <strong>{property.title}</strong>.
                  We'll review your request and send you an access code as soon as possible.
                </p>
                <button
                  className="popup-btn popup-btn-primary"
                  onClick={closeAllPopups}
                >
                  Got It
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
