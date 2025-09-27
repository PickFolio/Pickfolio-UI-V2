import { useState } from 'react';
import styles from './Form.module.css'; // Reusing our generic form styles

function JoinContestForm({ onSubmit, onCancel, isLoading }) {
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      onSubmit(inviteCode.trim().toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="inviteCode">Contest Invite Code</label>
        <input
          type="text"
          name="inviteCode"
          id="inviteCode"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className={styles.input}
          placeholder="Enter 6-digit code"
          maxLength="6"
          required
          autoFocus
        />
      </div>
      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={`${styles.button} ${styles.secondary}`}>Cancel</button>
        <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join Contest'}
        </button>
      </div>
    </form>
  );
}

export default JoinContestForm;