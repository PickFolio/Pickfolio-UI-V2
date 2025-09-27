import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/useAuthFetch';
import Spinner from './Spinner';
import styles from './ContestLobby.module.css';
import toast from 'react-hot-toast';
import Modal from './Modal';
import CreateContestForm from './CreateContestForm';
import JoinContestForm from './JoinContestForm';
import { getMyContests, joinContestByCode } from '../services/contestService';
import formStyles from './Form.module.css'
import { createContest } from '../services/contestService';

const CONTEST_API_URL = import.meta.env.VITE_CONTEST_API_URL;

const ContestCard = ({ contest, userId, onView }) => {
    const isCreator = contest.creatorId === userId;

    // Helper function to format date and time
    const formatDateTime = (isoString) => {
        return new Date(isoString).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true
        });
    };

    // Helper function to format the budget
    const formatBudget = (value) => {
        const num = Number(value);
        if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
        if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lac`;
        return `₹${num.toLocaleString('en-IN')}`;
    };

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{contest.name}</h3>
                {contest.isPrivate && (
                    <span className={styles.privateBadge}>Private</span>
                )}
            </div>

            <div className={styles.cardDetails}>
                <p>
                    <span className={styles.detailIcon}>💰</span>
                    Budget: <strong>{formatBudget(contest.virtualBudget)}</strong>
                </p>
                <p>
                    <span className={styles.detailIcon}>▶️</span>
                    Starts: <strong>{formatDateTime(contest.startTime)}</strong>
                </p>
                <p>
                    <span className={styles.detailIcon}>⏹️</span>
                    Ends: <strong>{formatDateTime(contest.endTime)}</strong>
                </p>
            </div>
            
            <div className={styles.cardFooter}>
                <span>👥 {contest.currentParticipants}/{contest.maxParticipants} Players</span>
            </div>

            {isCreator && contest.isPrivate && (
                <div className={styles.inviteCodeBox}>
                    Invite Code: <span className={styles.inviteCode}>{contest.inviteCode}</span>
                </div>
            )}

            <button onClick={() => onView(contest.id)} className={styles.button}>
                View Contest
            </button>
        </div>
    );
};

const ContestLobby = () => {
    const navigate = useNavigate();
    const { userId, logout } = useAuth();
    const authFetch = useAuthFetch();

    const [myContests, setMyContests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newlyCreatedContest, setNewlyCreatedContest] = useState(null);

    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setNewlyCreatedContest(null); // Reset the state when closing
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // In a real app, you'd fetch public contests too
            const myContestsData = await authFetch(`${CONTEST_API_URL}/my-contests`);
            setMyContests(myContestsData || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleViewContest = (contestId) => {
        navigate(`/contest/${contestId}`);
    };

    const handleJoinContest = async (inviteCode) => {
        setIsJoining(true);
        const promise = joinContestByCode(authFetch, inviteCode);

        try {
            await toast.promise(promise, {
                loading: 'Joining contest...',
                success: () => {
                    setShowJoinModal(false);
                    fetchData(); // Refresh the list of contests
                    return `Successfully joined contest!`;
                },
                error: (err) => err.message || 'Failed to join contest.',
            });
        } catch (error) {
            console.error("Failed to join contest:", error)
        } finally {
            setIsJoining(false);
        }
    };

    const handleCreateContest = async (contestData) => {
        setIsCreating(true);
        try {
            const newContest = await createContest(authFetch, contestData);
            toast.success(`Contest "${newContest.name}" created!`);
            fetchData(); // Refresh the lobby list in the background

            if (newContest.isPrivate) {
                setNewlyCreatedContest(newContest); // This will show the ShareCodeView
            } else {
                handleCloseCreateModal(); // Close modal immediately for public contests
            }
        } catch (err) {
            toast.error(err.message || 'Failed to create contest.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className={styles.lobbyContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Contest Lobby</h1>
                <div>
                    <button onClick={() => setShowJoinModal(true)} className={`${styles.button} ${styles.secondary}`}>
                        Join with Code
                    </button>
                    <button onClick={() => setShowCreateModal(true)} className={styles.button}>
                        Create Contest
                    </button>
                    <button onClick={logout} className={styles.button}>Logout</button>
                </div>
            </header>

            {isLoading && <Spinner />}
            {error && <p className={styles.error}>Could not load contests: {error}</p>}

            {!isLoading && !error && (
                <>
                    <h2 className={styles.sectionTitle}>My Contests</h2>
                    {myContests.length > 0 ? (
                        <div className={styles.grid}>
                            {myContests.map(contest => (
                                <ContestCard 
                                    key={contest.id} 
                                    contest={contest} 
                                    userId={userId} // Pass the userId here
                                    onView={handleViewContest} 
                                />
                            ))}
                        </div>
                    ) : (
                        <p>You haven't joined or created any contests yet.</p>
                    )}
                </>
            )}

            <Modal 
              isOpen={showCreateModal} 
              onClose={handleCloseCreateModal} 
              title={newlyCreatedContest ? "Share Your Invite Code" : "Create a New Contest"}
            >
                {newlyCreatedContest ? (
                    <ShareCodeView contest={newlyCreatedContest} onDone={handleCloseCreateModal} />
                ) : (
                    <CreateContestForm 
                        onSubmit={handleCreateContest} 
                        onCancel={handleCloseCreateModal} 
                        isLoading={isCreating}
                    />
                )}
            </Modal>

            <Modal
              isOpen={showJoinModal}
              onClose={() => setShowJoinModal(false)}
              title="Join a Private Contest"
            >
                <JoinContestForm
                    onSubmit={handleJoinContest}
                    onCancel={() => setShowJoinModal(false)}
                    isLoading={isJoining}
                />
            </Modal>
        </div>
    );
};

const ShareCodeView = ({ contest, onDone }) => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(contest.inviteCode).then(() => {
            toast.success('Invite code copied!');
        });
    };

    return (
        <div className={formStyles.shareContainer}>
            <h3 className={formStyles.shareTitle}>Private Contest Created!</h3>
            <p className={formStyles.shareSubtitle}>Share this code with your friends:</p>
            <div className={formStyles.shareCodeBox}>
                <span className={formStyles.shareCode}>{contest.inviteCode}</span>
                <button onClick={copyToClipboard} className={formStyles.copyButton}>
                    {/* ... (copy icon svg) ... */}
                </button>
            </div>
            <button onClick={onDone} className={formStyles.button}>Done</button>
        </div>
    );
};

export default ContestLobby;