import { useState, useEffect } from 'react';
import ButtonDali from './ButtonDali';

export default function PasswordGate({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem('site_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'Admin@123') {
      localStorage.setItem('site_auth', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Password incorrect');
      setPassword('');
    }
  };

  if (isChecking) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px',
          width: '90%'
        }}>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '28px',
            color: '#c19280',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            Site Access
          </h2>
          <p style={{
            fontFamily: 'Glacial Indifference, sans-serif',
            fontSize: '16px',
            color: '#7a7a7a',
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            This site is temporarily protected. Please enter the password to continue.
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '20px',
                fontFamily: 'Glacial Indifference, sans-serif'
              }}
            />
            {error && (
              <p style={{
                color: '#e74c3c',
                fontSize: '14px',
                marginBottom: '15px',
                textAlign: 'center',
                fontFamily: 'Glacial Indifference, sans-serif'
              }}>
                {error}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ButtonDali type="submit">
                Enter
              </ButtonDali>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return children;
}
