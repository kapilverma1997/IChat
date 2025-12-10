'use client';

import { useState } from 'react';
import styles from './ChatLockScreen.module.css';

export default function ChatLockScreen({ chatId, groupId, lockType, onUnlock }) {
  const [lockValue, setLockValue] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/security/lockChat', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chatId,
          groupId,
          lockValue,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onUnlock(data.dataKey);
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid unlock code');
      }
    } catch (error) {
      setError('Failed to unlock chat');
      console.error('Error unlocking chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (lockType) {
      case 'pin':
        return 'Enter PIN';
      case 'password':
        return 'Enter password';
      case 'fingerprint':
        return 'Use fingerprint';
      case 'webauthn':
        return 'Use security key';
      default:
        return 'Enter unlock code';
    }
  };

  return (
    <div className={styles.lockScreen}>
      <div className={styles.lockContent}>
        <div className={styles.lockIcon}>🔒</div>
        <h2 className={styles.title}>Chat Locked</h2>
        <p className={styles.description}>
          This chat is protected. Enter your {lockType === 'pin' ? 'PIN' : 'password'} to unlock.
        </p>

        <form onSubmit={handleUnlock} className={styles.form}>
          <input
            type={lockType === 'pin' ? 'number' : 'password'}
            className={styles.input}
            placeholder={getPlaceholder()}
            value={lockValue}
            onChange={(e) => setLockValue(e.target.value)}
            autoFocus
            maxLength={lockType === 'pin' ? 6 : undefined}
          />

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.unlockButton}
            disabled={loading || !lockValue}
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

