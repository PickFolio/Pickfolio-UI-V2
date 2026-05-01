import { useState } from 'react';
import { Calendar, Shield, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { DateTimePicker } from '@/components/ui/DateTimePicker';

const pad = (value) => value.toString().padStart(2, '0');

const formatForInput = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const getSmartDefaultTimes = () => {
  const now = new Date();
  const startDate = new Date(now);
  const marketOpen = new Date(now);
  marketOpen.setHours(9, 15, 0, 0);

  if (now > marketOpen) startDate.setDate(startDate.getDate() + 1);
  while (startDate.getDay() === 0 || startDate.getDay() === 6) startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(9, 15, 0, 0);

  const endDate = new Date(startDate);
  endDate.setHours(16, 0, 0, 0);
  return { startTime: formatForInput(startDate), endTime: formatForInput(endDate) };
};

const validate = (formData) => {
  const errors = {};
  if (!formData.name.trim()) errors.name = 'Contest name is required.';
  if (new Date(formData.startTime) <= new Date()) errors.startTime = 'Start time must be in the future.';
  if (new Date(formData.endTime) <= new Date(formData.startTime)) errors.endTime = 'End time must be after start time.';
  if (Number(formData.virtualBudget) <= 0) errors.virtualBudget = 'Budget must be greater than zero.';
  if (Number(formData.maxParticipants) < 2) errors.maxParticipants = 'At least two participants are required.';
  return errors;
};

function CreateContestForm({ onSubmit, onCancel, isLoading }) {
  const defaults = getSmartDefaultTimes();
  const [formData, setFormData] = useState({
    name: '',
    isPrivate: false,
    startTime: defaults.startTime,
    endTime: defaults.endTime,
    virtualBudget: '100000',
    maxParticipants: '10',
  });
  const [errors, setErrors] = useState({});

  const update = (name, value) => {
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(formData);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    onSubmit({
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
      virtualBudget: Number(formData.virtualBudget),
      maxParticipants: Number(formData.maxParticipants),
    });
  };

  return (
    <form className="compact-form" onSubmit={handleSubmit} noValidate>
      <FormField
        id="contest-name"
        label="Contest name"
        error={errors.name}
        inputProps={{
          value: formData.name,
          onChange: (event) => update('name', event.target.value),
          placeholder: 'Monday Market Sprint',
          autoFocus: true,
        }}
      />

      <div className="grid-auto">
        <FormField id="start-time" label="Start time" error={errors.startTime}>
          <DateTimePicker id="start-time" value={formData.startTime} onChange={(value) => update('startTime', value)} />
        </FormField>
        <FormField id="end-time" label="End time" error={errors.endTime}>
          <DateTimePicker id="end-time" value={formData.endTime} onChange={(value) => update('endTime', value)} />
        </FormField>
      </div>

      <div className="grid-auto">
        <FormField id="virtual-budget" label="Virtual budget" error={errors.virtualBudget}>
          <div style={{ position: 'relative' }}>
            <Wallet size={18} style={{ position: 'absolute', left: '0.85rem', top: '0.9rem', color: 'var(--color-text-muted)' }} aria-hidden="true" />
            <Input
              id="virtual-budget"
              type="number"
              min="1"
              value={formData.virtualBudget}
              onChange={(event) => update('virtualBudget', event.target.value)}
              style={{ paddingLeft: '2.45rem' }}
              error={errors.virtualBudget}
            />
          </div>
        </FormField>
        <FormField id="max-participants" label="Max participants" error={errors.maxParticipants}>
          <div style={{ position: 'relative' }}>
            <Users size={18} style={{ position: 'absolute', left: '0.85rem', top: '0.9rem', color: 'var(--color-text-muted)' }} aria-hidden="true" />
            <Input
              id="max-participants"
              type="number"
              min="2"
              value={formData.maxParticipants}
              onChange={(event) => update('maxParticipants', event.target.value)}
              style={{ paddingLeft: '2.45rem' }}
              error={errors.maxParticipants}
            />
          </div>
        </FormField>
      </div>

      <button
        type="button"
        className="card spread card-interactive"
        style={{ padding: 'var(--space-3)' }}
        onClick={() => update('isPrivate', !formData.isPrivate)}
        aria-pressed={formData.isPrivate}
      >
        <span className="cluster">
          <Shield size={20} color="var(--color-accent)" />
          <span style={{ textAlign: 'left' }}>
            <strong style={{ display: 'block' }}>Private contest</strong>
            <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>Require an invite code to join.</span>
          </span>
        </span>
        <span className={formData.isPrivate ? 'badge badge-success' : 'badge'}>{formData.isPrivate ? 'On' : 'Off'}</span>
      </button>

      <div className="compact-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          <Calendar size={18} /> {isLoading ? 'Creating...' : 'Create contest'}
        </Button>
      </div>
    </form>
  );
}

export default CreateContestForm;
