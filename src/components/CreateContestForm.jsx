import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuthFetch from '../hooks/useAuthFetch';
import { createContest } from '../services/contestService';
import styles from './Form.module.css';

function CreateContestForm({ onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: '',
        isPrivate: false,
        startTime: '',
        endTime: '',
        virtualBudget: '100000',
        maxParticipants: '10',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [newlyCreatedContest, setNewlyCreatedContest] = useState(null);
    const authFetch = useAuthFetch();
    
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
    
        setIsLoading(true);
        try {
            const payload = {
              ...formData,
              startTime: new Date(formData.startTime).toISOString(),
              endTime: new Date(formData.endTime).toISOString(),
              virtualBudget: parseFloat(formData.virtualBudget),
              maxParticipants: parseInt(formData.maxParticipants, 10),
            };
    
            const newContest = await createContest(authFetch, payload);
            toast.success(`Contest "${newContest.name}" created!`);
    
            if (newContest.isPrivate) {
                setNewlyCreatedContest(newContest);
            } else {
                onSuccess(); // For public contests, close modal immediately
            }
        } catch (err) {
            toast.error(err.message || 'Failed to create contest.');
        } finally {
            setIsLoading(false);
        }
    };
      
    // Conditionally render the success view or the form
    if (newlyCreatedContest) {
        return <ShareCodeView contest={newlyCreatedContest} onDone={onSuccess} />
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
                <label htmlFor="name">Contest Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={styles.input} required />
            </div>

            <div className={styles.grid}>
                <div className={styles.formGroup}>
                    <label htmlFor="startTime">Start Time</label>
                    <input type="datetime-local" name="startTime" id="startTime" value={formData.startTime} onChange={handleChange} className={styles.input} required />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="endTime">End Time</label>
                    <input type="datetime-local" name="endTime" id="endTime" value={formData.endTime} onChange={handleChange} className={styles.input} required />
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

const ShareCodeView = ({ contest, onDone }) => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(contest.inviteCode).then(() => {
            toast.success('Invite code copied!');
        }, () => {
            toast.error('Failed to copy code.');
        });
    };

    return (
        <div className={styles.shareContainer}>
            <h3 className={styles.shareTitle}>Private Contest Created!</h3>
            <p className={styles.shareSubtitle}>Share this code with your friends:</p>
            <div className={styles.shareCodeBox}>
                <span className={styles.shareCode}>{contest.inviteCode}</span>
                <button onClick={copyToClipboard} className={styles.copyButton} title="Copy code">
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M320-240q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480v-480H320v480ZM160-80q-33 0-56.5-23.5T80-160v-560h80v560h560v80H160Zm160-720v480-480Z"/></svg>
                </button>
            </div>
            <button onClick={onDone} className={styles.button}>Done</button>
        </div>
    );
};

export default CreateContestForm;