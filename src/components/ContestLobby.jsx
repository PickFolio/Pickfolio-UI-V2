import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/useAuthFetch';
import Spinner from './Spinner';
import styles from './ContestLobby.module.css';

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

    return (
        <div className={styles.lobbyContainer}>
            <header className={styles.header}>
                <h1 className={styles.title}>Contest Lobby</h1>
                <button onClick={logout} className={styles.button}>Logout</button>
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
        </div>
    );
};

export default ContestLobby;