'use client';

import { useState, useEffect } from 'react';
import styles from './SuspiciousLoginAlert.module.css';

export default function SuspiciousLoginAlert({ sessionId, onDismiss }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails();
    }
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/alerts/suspiciousLogin', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const sessionData = data.suspiciousLogins?.find(
          (s) => s._id === sessionId
        );
        if (sessionData) {
          setSession(sessionData);
        }
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSecureAccount = () => {
    // Redirect to security settings or password reset
    window.location.href = '/profile?tab=security';
  };

  if (loading || !session) {
    return null;
  }

  return (
    <div className={styles.alert}>
      <div className={styles.icon}>⚠️</div>
      <div className={styles.content}>
        <h3 className={styles.title}>Suspicious Login Detected</h3>
        <p className={styles.message}>
          A login was detected from {session.ipAddress}
          {session.location?.city && ` in ${session.location.city}`}.
        </p>
        {session.suspiciousReasons && session.suspiciousReasons.length > 0 && (
          <div className={styles.reasons}>
            <strong>Reasons:</strong>{' '}
            {session.suspiciousReasons.join(', ')}
          </div>
        )}
        <div className={styles.actions}>
          <button
            className={styles.secureButton}
            onClick={handleSecureAccount}
          >
            Secure Account
          </button>
          <button
            className={styles.dismissButton}
            onClick={onDismiss}
          >
            This Was Me
          </button>
        </div>
      </div>
    </div>
  );
}

