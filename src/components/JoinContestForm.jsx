import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';

function JoinContestForm({ onSubmit, onCancel, isLoading }) {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 6) {
      setError('Invite code must be 6 characters.');
      return;
    }
    onSubmit(code);
  };

  return (
    <form className="compact-form" onSubmit={handleSubmit} noValidate>
      <FormField
        id="inviteCode"
        label="Invite code"
        error={error}
        inputProps={{
          value: inviteCode,
          onChange: (event) => {
            setInviteCode(event.target.value.toUpperCase());
            setError('');
          },
          placeholder: 'A1B2C3',
          maxLength: 6,
          autoFocus: true,
          style: { textAlign: 'center', letterSpacing: '0.14em', fontWeight: 850, fontSize: 'var(--text-xl)' },
        }}
      />
      <div className="compact-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          <KeyRound size={18} /> {isLoading ? 'Joining...' : 'Join contest'}
        </Button>
      </div>
    </form>
  );
}

export default JoinContestForm;
