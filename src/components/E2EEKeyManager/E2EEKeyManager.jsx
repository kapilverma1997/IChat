'use client';

import { useState, useEffect } from 'react';
import styles from './E2EEKeyManager.module.css';

export default function E2EEKeyManager({ userId }) {
  const [publicKey, setPublicKey] = useState(null);
  const [hasPrivateKey, setHasPrivateKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchKeys();
  }, [userId]);

  const fetchKeys = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/security/e2ee', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPublicKey(data.publicKey);
        setHasPrivateKey(data.hasPrivateKey);
      }
    } catch (error) {
      console.error('Error fetching keys:', error);
    }
  };

  const generateKeys = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/security/e2ee', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPublicKey(data.publicKey);
        setHasPrivateKey(true);
        setMessage('Key pair generated successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to generate keys');
      }
    } catch (error) {
      setError('Failed to generate keys');
      console.error('Error generating keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyPublicKey = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      setMessage('Public key copied to clipboard!');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>End-to-End Encryption Keys</h2>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Your Public Key</h3>
        {publicKey ? (
          <div className={styles.keyContainer}>
            <textarea
              className={styles.keyText}
              value={publicKey}
              readOnly
              rows={6}
            />
            <button
              className={styles.copyButton}
              onClick={copyPublicKey}
            >
              Copy
            </button>
          </div>
        ) : (
          <p className={styles.noKey}>No public key generated yet</p>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Key Status</h3>
        <div className={styles.status}>
          <span className={styles.statusLabel}>Public Key:</span>
          <span className={publicKey ? styles.statusOk : styles.statusError}>
            {publicKey ? 'Generated' : 'Not Generated'}
          </span>
        </div>
        <div className={styles.status}>
          <span className={styles.statusLabel}>Private Key:</span>
          <span className={hasPrivateKey ? styles.statusOk : styles.statusError}>
            {hasPrivateKey ? 'Stored (Encrypted)' : 'Not Stored'}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.generateButton}
          onClick={generateKeys}
          disabled={loading || hasPrivateKey}
        >
          {loading ? 'Generating...' : hasPrivateKey ? 'Keys Already Generated' : 'Generate Key Pair'}
        </button>
      </div>

      <div className={styles.info}>
        <h4>How E2EE Works:</h4>
        <ul>
          <li>Your public key is shared with other users</li>
          <li>Your private key is encrypted and stored securely</li>
          <li>Messages are encrypted with AES-256 before sending</li>
          <li>Session keys are exchanged using RSA encryption</li>
          <li>Only you and the recipient can decrypt messages</li>
        </ul>
      </div>
    </div>
  );
}

