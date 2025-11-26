import { useState } from 'react';
import toast from 'react-hot-toast';
import styles from './Form.module.css';

// Helper to calculate smart defaults for Indian Market Hours
const getSmartDefaultTimes = () => {
    const now = new Date();
    let startDate = new Date(now);

    // 1. Determine the target Start Date
    // Set threshold to today at 9:15 AM
    const todayMarketOpen = new Date(now);
    todayMarketOpen.setHours(9, 15, 0, 0);

    if (now > todayMarketOpen) {
        // If it's past 9:15 AM, move to tomorrow
        startDate.setDate(startDate.getDate() + 1);
    }

    // 2. Handle Weekends (Skip Sat/Sun)
    // 0 = Sunday, 6 = Saturday
    while (startDate.getDay() === 0 || startDate.getDay() === 6) {
        startDate.setDate(startDate.getDate() + 1);
    }

    // 3. Create Start Time (09:15 AM)
    startDate.setHours(9, 15, 0, 0);

    // 4. Create End Time (04:00 PM on the SAME day)
    const endDate = new Date(startDate);
    endDate.setHours(16, 0, 0, 0);

    // 5. Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatForInput = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    return {
        startTime: formatForInput(startDate),
        endTime: formatForInput(endDate)
    };
};

function CreateContestForm({ onSubmit, onCancel, isLoading }) {
    // Initialize state with smart defaults
    const defaults = getSmartDefaultTimes();

    const [formData, setFormData] = useState({
        name: '',
        isPrivate: false,
        startTime: defaults.startTime,
        endTime: defaults.endTime,
        virtualBudget: '100000',
        maxParticipants: '10',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (new Date(formData.endTime) <= new Date(formData.startTime)) {
            toast.error("End time must be after the start time.");
            return;
        }

        const payload = {
            ...formData,
            startTime: new Date(formData.startTime).toISOString(),
            endTime: new Date(formData.endTime).toISOString(),
            virtualBudget: parseFloat(formData.virtualBudget),
            maxParticipants: parseInt(formData.maxParticipants, 10),
        };

        onSubmit(payload)
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
                <label htmlFor="name">Contest Name</label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="e.g. Monday Morning Blitz"
                    required
                    autoFocus
                />
            </div>

            <div className={styles.grid}>
                <div className={styles.formGroup}>
                    <label htmlFor="startTime">Start Time</label>
                    <input
                        type="datetime-local"
                        name="startTime"
                        id="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        className={styles.input}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="endTime">End Time</label>
                    <input
                        type="datetime-local"
                        name="endTime"
                        id="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className={styles.input}
                        required
                    />
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.formGroup}>
                    <label htmlFor="virtualBudget">Virtual Budget (₹)</label>
                    <input type="number" name="virtualBudget" id="virtualBudget" value={formData.virtualBudget} onChange={handleChange} className={styles.input} required min="1" />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="maxParticipants">Max Participants</label>
                    <input type="number" name="maxParticipants" id="maxParticipants" value={formData.maxParticipants} onChange={handleChange} className={styles.input} required min="2" />
                </div>
            </div>
      
            <div className={styles.checkboxGroup}>
                <input type="checkbox" name="isPrivate" id="isPrivate" checked={formData.isPrivate} onChange={handleChange} className={styles.checkbox}/>
                <label htmlFor="isPrivate">Private Contest</label>
            </div>

            <div className={styles.formActions}>
                <button type="button" onClick={onCancel} className={`${styles.button} ${styles.secondary}`}>Cancel</button>
                <button type="submit" className={styles.button} disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Contest'}
                </button>
            </div>
        </form>
    );
}

export default CreateContestForm;