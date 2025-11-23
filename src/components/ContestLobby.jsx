import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/useAuthFetch';
import Spinner from './Spinner';
import styles from './ContestLobby.module.css';
import toast from 'react-hot-toast';
import Modal from './Modal';
import CreateContestForm from './CreateContestForm';
import JoinContestForm from './JoinContestForm';
import formStyles from './Form.module.css'
import {
    getMyContests,
    getOpenPublicContests,
    joinContestByCode,
    joinContest,
    createContest
} from '../services/contestService';

const ContestCard = ({ contest, userId, onAction, actionLabel, isProcessing }) => {
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

    // Determine status color badge
    let statusBadge = null;
    if (contest.status === 'LIVE') {
        statusBadge = <span style={{ backgroundColor: '#22c55e', color: '#fff', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '999px', fontWeight: 'bold' }}>LIVE</span>;
    } else if (contest.status === 'COMPLETED') {
        statusBadge = <span style={{ backgroundColor: '#64748b', color: '#fff', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '999px' }}>Ended</span>;
    }

    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>{contest.name}</h3>
                    {statusBadge}
                </div>
                {contest.isPrivate && (
                    <span className={styles.privateBadge}>Private</span>
                )}
            </div>

            <div className={styles.cardDetails}>
                <p><span className={styles.detailIcon}>💰</span> Budget: <strong>{formatBudget(contest.virtualBudget)}</strong></p>
                <p><span className={styles.detailIcon}>▶️</span> Starts: <strong>{formatDateTime(contest.startTime)}</strong></p>
                <p><span className={styles.detailIcon}>⏹️</span> Ends: <strong>{formatDateTime(contest.endTime)}</strong></p>
            </div>

            <div className={styles.cardFooter}>
                <span>👥 {contest.currentParticipants}/{contest.maxParticipants} Players</span>
            </div>

            {isCreator && contest.isPrivate && contest.status === 'OPEN' && (
                <div className={styles.inviteCodeBox}>
                    Invite Code: <span className={styles.inviteCode}>{contest.inviteCode}</span>
                </div>
            )}

            <button onClick={() => onAction(contest.id)} className={styles.button} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : actionLabel}
            </button>
        </div>
    );
};

const ContestLobby = () => {
    const navigate = useNavigate();
    const { userId, logout } = useAuth();
    const authFetch = useAuthFetch();

    const [myContests, setMyContests] = useState([]);
    const [publicContests, setPublicContests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal States
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [joiningContestId, setJoiningContestId] = useState(null);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newlyCreatedContest, setNewlyCreatedContest] = useState(null);

    // UI State for History
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setNewlyCreatedContest(null);
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            // Fetch both "My Contests" and "Open Public Contests" in parallel
            const [myContestsData, publicContestsData] = await Promise.all([
                getMyContests(authFetch),
                getOpenPublicContests(authFetch)
            ]);
            setMyContests(myContestsData || []);
            setPublicContests(publicContestsData || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Categorize Contests ---
    const { live, upcoming, history } = useMemo(() => {
        const live = [];
        const upcoming = [];
        const history = [];

        myContests.forEach(c => {
            if (c.status === 'LIVE') live.push(c);
            else if (c.status === 'OPEN') upcoming.push(c);
            else history.push(c); // COMPLETED or CANCELLED
        });

        return { live, upcoming, history };
    }, [myContests]);

    // --- Filter Discovery Section ---
    const myContestIds = new Set(myContests.map(c => c.id));
    const availablePublicContests = publicContests.filter(c => !myContestIds.has(c.id));


    // --- Handlers ---
    const handleViewContest = (contestId) => navigate(`/contest/${contestId}`);

    const handleJoinPublicContest = async (contestId) => {
        setJoiningContestId(contestId);
        try {
            await joinContest(authFetch, contestId);
            toast.success('Successfully joined!');
            fetchData();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setJoiningContestId(null);
        }
    };

    const handleJoinContestByCode = async (inviteCode) => {
        setIsJoining(true);
        const promise = joinContestByCode(authFetch, inviteCode);
        try {
            await toast.promise(promise, {
                loading: 'Joining...',
                success: () => {
                    setShowJoinModal(false);
                    fetchData();
                    return `Joined successfully!`;
                },
                error: (err) => err.message,
            });
        } catch (error) { console.error(error); }
        finally { setIsJoining(false); }
    };

    const handleCreateContest = async (contestData) => {
        setIsCreating(true);
        try {
            const newContest = await createContest(authFetch, contestData);
            toast.success(`Contest "${newContest.name}" created!`);
            fetchData();
            if (newContest.isPrivate) setNewlyCreatedContest(newContest);
            else handleCloseCreateModal();
        } catch (err) {
            toast.error(err.message);
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
                        Enter Code
                    </button>
                    <button onClick={() => setShowCreateModal(true)} className={styles.button}>
                        Create
                    </button>
                    <button onClick={logout} className={`${styles.button} ${styles.logout}`}>Logout</button>
                </div>
            </header>

            {isLoading && <Spinner />}
            {error && <p className={styles.error}>Could not load data: {error}</p>}

            {!isLoading && !error && (
                <>
                    {/* 1. Live Contests */}
                    {live.length > 0 && (
                        <div className={styles.liveSection}>
                            <h2 className={styles.sectionTitle}>🔴 Live Contests</h2>
                            <div className={styles.grid}>
                                {live.map(contest => (
                                    <ContestCard
                                        key={contest.id}
                                        contest={contest}
                                        userId={userId}
                                        onAction={handleViewContest}
                                        actionLabel="Enter Dashboard"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. Upcoming Contests */}
                    <h2 className={styles.sectionTitle}>My Upcoming Contests</h2>
                    {upcoming.length > 0 ? (
                        <div className={styles.grid} style={{ marginBottom: '2rem' }}>
                            {upcoming.map(contest => (
                                <ContestCard
                                    key={contest.id}
                                    contest={contest}
                                    userId={userId}
                                    onAction={handleViewContest}
                                    actionLabel="View Details"
                                />
                            ))}
                        </div>
                    ) : (
                        <p className={styles.emptyState} style={{ marginBottom: '2rem' }}>
                            You don't have any upcoming contests.
                        </p>
                    )}

                    {/* 3. Collapsible History */}
                    {history.length > 0 && (
                        <div>
                            <div
                                className={styles.collapsibleHeader}
                                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                            >
                                <span className={`${styles.chevron} ${isHistoryExpanded ? styles.open : ''}`}>▶</span>
                                <h2 className={styles.sectionTitle} style={{ margin: 0, fontSize: '1.2rem' }}>
                                    Completed Contests ({history.length})
                                </h2>
                            </div>

                            {isHistoryExpanded && (
                                <div className={styles.grid} style={{ marginBottom: '2rem' }}>
                                    {history.map(contest => (
                                        <ContestCard
                                            key={contest.id}
                                            contest={contest}
                                            userId={userId}
                                            onAction={handleViewContest}
                                            actionLabel="View Results"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <hr className={styles.divider} style={{ margin: '3rem 0', borderColor: 'var(--border-color)' }} />

                    {/* 4. Discovery Section */}
                    <h2 className={styles.sectionTitle}>Discover Open Contests</h2>
                    {availablePublicContests.length > 0 ? (
                        <div className={styles.grid}>
                            {availablePublicContests.map(contest => (
                                <ContestCard
                                    key={contest.id}
                                    contest={contest}
                                    userId={userId}
                                    onAction={handleJoinPublicContest}
                                    actionLabel="Join Contest"
                                    isProcessing={joiningContestId === contest.id}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className={styles.emptyState}>No new public contests available to join.</p>
                    )}
                </>
            )}

            <Modal isOpen={showCreateModal} onClose={handleCloseCreateModal} title={newlyCreatedContest ? "Share Code" : "Create Contest"}>
                {newlyCreatedContest ? (
                    <ShareCodeView contest={newlyCreatedContest} onDone={handleCloseCreateModal} />
                ) : (
                    <CreateContestForm onSubmit={handleCreateContest} onCancel={handleCloseCreateModal} isLoading={isCreating} />
                )}
            </Modal>

            <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join Private Contest">
                <JoinContestForm onSubmit={handleJoinContestByCode} onCancel={() => setShowJoinModal(false)} isLoading={isJoining} />
            </Modal>
        </div>
    );
};

const ShareCodeView = ({ contest, onDone }) => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(contest.inviteCode).then(() => {
            toast.success('Copied!');
        });
    };

    return (
        <div className={formStyles.shareContainer}>
            <h3 className={formStyles.shareTitle}>Contest Created!</h3>
            <p className={formStyles.shareSubtitle}>Share this code:</p>
            <div className={formStyles.shareCodeBox}>
                <span className={formStyles.shareCode}>{contest.inviteCode}</span>
                <button onClick={copyToClipboard} className={formStyles.copyButton}>📋</button>
            </div>
            <button onClick={onDone} className={formStyles.button}>Done</button>
        </div>
    );
};

export default ContestLobby;