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

const CONTEST_API_URL = import.meta.env.VITE_CONTEST_API_URL;

const ContestCard = ({ contest, onView }) => (
    <div className={styles.card}>
        <h3 className={styles.cardTitle}>{contest.name}</h3>
        <p>Players: {contest.currentParticipants}/{contest.maxParticipants}</p>
        <button onClick={() => onView(contest.id)} className={styles.button}>
            View Contest
        </button>
    </div>
);

const ContestLobby = () => {
    const navigate = useNavigate();
    const { userId, logout } = useAuth();
    const authFetch = useAuthFetch();

    const [myContests, setMyContests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

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

    const handleCreationSuccess = () => {
        setShowCreateModal(false);
        fetchData(); // Just close the modal and refresh the data
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
                                <ContestCard key={contest.id} contest={contest} onView={handleViewContest} />
                            ))}
                        </div>
                    ) : (
                        <p>You haven't joined or created any contests yet.</p>
                    )}
                </>
            )}

            <Modal 
              isOpen={showCreateModal} 
              onClose={() => setShowCreateModal(false)} 
              title="Create a New Contest"
            >
                <CreateContestForm 
                    onSuccess={handleCreationSuccess}
                    onCancel={() => setShowCreateModal(false)}
                />
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

export default ContestLobby;