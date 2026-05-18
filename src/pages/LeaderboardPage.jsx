import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Client as StompClient } from '@stomp/stompjs';
import { ArrowLeft, BarChart3, Medal, RefreshCw, Trophy, Users, Wallet, Bot } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/useAuthFetch';
import { getContestDetails, getLeaderboard, getPortfolio } from '../services/contestService';

const makeWsUrl = () => {
  const configured = import.meta.env.VITE_CONTEST_WS_URL;
  if (configured) return configured;
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws-contests`;
};

const formatCurrency = (value, compact = false) => {
  if (value === null || typeof value === 'undefined' || Number.isNaN(Number(value))) return 'Rs. 0';
  return `Rs. ${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
  })}`;
};

const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const rankTone = (rank) => {
  if (rank === 1) return 'warning';
  if (rank <= 3) return 'success';
  return 'neutral';
};

function LeaderboardHeader({ contest }) {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <div className="brand">
          <Link to={`/contest/${contest?.id || ''}`} className="icon-btn" aria-label="Back to dashboard"><ArrowLeft size={18} /></Link>
          <div>
            <p className="brand-subtitle">Contest leaderboard</p>
            <h1 className="brand-title">{contest?.name || 'Leaderboard'}</h1>
          </div>
        </div>
        <Badge tone={contest?.status === 'LIVE' ? 'live' : contest?.status === 'COMPLETED' ? 'success' : 'warning'}>{contest?.status || 'Loading'}</Badge>
      </div>
    </header>
  );
}

function PodiumCard({ player, featured = false }) {
  if (!player) return null;
  const returnPct = Number(player.returnPct || 0);

  return (
    <article className={featured ? 'podium-card podium-card-first' : 'podium-card'}>
      <div className="spread">
        <Badge tone={rankTone(player.rank)}>{player.rank === 1 ? 'Leader' : `#${player.rank}`}</Badge>
        {player.isCurrentUser ? <Badge tone="success">You</Badge> : null}
      </div>
      <div className="leaderboard-avatar" aria-hidden="true">{getInitials(player.username)}</div>
      <div>
        <h3 className="section-title" style={{ marginBottom: 'var(--space-2)' }}>{player.username}</h3>
        <p className="muted" style={{ margin: 0 }}>{formatCurrency(player.totalPortfolioValue)}</p>
      </div>
      <strong style={{ color: returnPct >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
        {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
      </strong>
    </article>
  );
}

function LeaderboardRow({ player }) {
  const returnPct = Number(player.returnPct || 0);

  return (
    <div className={player.isCurrentUser ? 'leaderboard-rank-row leaderboard-rank-row-active' : 'leaderboard-rank-row'}>
      <span className="rank-pill">{player.rank}</span>
      <div className="leaderboard-player">
        <span className="leaderboard-avatar leaderboard-avatar-sm" aria-hidden="true">
          {player.isBot ? <Bot size={16} /> : getInitials(player.username)}
        </span>
        <div>
          <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {player.username}
            {player.isBot && <Badge tone="neutral" style={{ padding: '0 4px', fontSize: '0.65rem' }}>{player.personaType?.replace('_', ' ')}</Badge>}
          </strong>
          {player.isCurrentUser ? <p className="muted" style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Your position</p> : null}
        </div>
      </div>
      <div className="leaderboard-value">
        <strong>{formatCurrency(player.totalPortfolioValue, true)}</strong>
        <p style={{ margin: 0, color: returnPct >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontSize: 'var(--text-sm)' }}>
          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}

function LeaderboardPage() {
  const { contestId } = useParams();
  const authFetch = useAuthFetch();
  const { tokens } = useAuth();
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentParticipantId, setCurrentParticipantId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadLeaderboard = useCallback(async ({ showLoading = false } = {}) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(!showLoading);
    setError('');

    try {
      const [contestData, leaderboardData, portfolioResult] = await Promise.all([
        getContestDetails(authFetch, contestId),
        getLeaderboard(authFetch, contestId),
        getPortfolio(authFetch, contestId).catch(() => null),
      ]);
      setContest(contestData);
      setLeaderboard(leaderboardData || []);
      setCurrentParticipantId(portfolioResult?.participantId || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [authFetch, contestId]);

  useEffect(() => {
    loadLeaderboard({ showLoading: true });
  }, [loadLeaderboard]);

  useEffect(() => {
    if (!tokens?.accessToken || !contestId) return undefined;

    const stompClient = new StompClient({
      brokerURL: makeWsUrl(),
      connectHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {
      stompClient.subscribe(`/topic/contest/${contestId}`, (message) => {
        const update = JSON.parse(message.body);
        setLeaderboard((current) =>
          current
            .map((player) => player.participantId === update.participantId ? { ...player, totalPortfolioValue: update.totalPortfolioValue } : player)
            .sort((a, b) => Number(b.totalPortfolioValue) - Number(a.totalPortfolioValue))
        );
      });
    };

    stompClient.activate();
    return () => stompClient.deactivate();
  }, [contestId, tokens?.accessToken]);

  const rankedPlayers = useMemo(() => {
    const startingBudget = Number(contest?.virtualBudget || 0);
    return [...leaderboard]
      .sort((a, b) => Number(b.totalPortfolioValue) - Number(a.totalPortfolioValue))
      .map((player, index) => {
        const totalPortfolioValue = Number(player.totalPortfolioValue || 0);
        return {
          ...player,
          rank: index + 1,
          totalPortfolioValue,
          returnPct: startingBudget ? ((totalPortfolioValue - startingBudget) / startingBudget) * 100 : 0,
          isCurrentUser: player.participantId === currentParticipantId,
        };
      });
  }, [contest?.virtualBudget, currentParticipantId, leaderboard]);

  const podium = [rankedPlayers[1], rankedPlayers[0], rankedPlayers[2]];
  const leader = rankedPlayers[0];
  const currentPlayer = rankedPlayers.find((player) => player.isCurrentUser);
  const averageValue = rankedPlayers.length
    ? rankedPlayers.reduce((sum, player) => sum + Number(player.totalPortfolioValue || 0), 0) / rankedPlayers.length
    : 0;

  return (
    <div className="app-shell page">
      <LeaderboardHeader contest={contest || { id: contestId }} />

      <main className="container page-main leaderboard-stage">
        {error ? (
          <section className="empty-state">
            <BarChart3 size={30} />
            <h3>Could not load leaderboard</h3>
            <p>{error}</p>
            <Button onClick={() => loadLeaderboard({ showLoading: true })}><RefreshCw size={18} /> Retry</Button>
          </section>
        ) : isLoading ? (
          <div className="stack">
            <CardSkeleton rows={3} />
            <CardSkeleton rows={5} />
          </div>
        ) : !rankedPlayers.length ? (
          <section className="empty-state">
            <Trophy size={30} />
            <h3>No standings yet</h3>
            <p>Players will appear here as soon as they join this contest.</p>
          </section>
        ) : (
          <>
            <section className="leaderboard-hero card card-pad stack">
              <div className="spread leaderboard-hero-head">
                <div>
                  <p className="eyebrow">Leaderboard</p>
                  <h2 className="section-title" style={{ margin: 0 }}>Live standings</h2>
                </div>
                <Button variant="secondary" size="sm" onClick={() => loadLeaderboard()} disabled={isRefreshing}>
                  <RefreshCw size={16} /> {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
              {currentPlayer ? (
                <div className="leaderboard-current">
                  <span className="rank-pill">{currentPlayer.rank}</span>
                  <div>
                    <strong>{currentPlayer.username}</strong>
                    <p className="muted" style={{ margin: 0 }}>Your rank in this contest</p>
                  </div>
                  <strong>{formatCurrency(currentPlayer.totalPortfolioValue, true)}</strong>
                </div>
              ) : null}
            </section>

            <section className="insight-grid">
              <div className="insight-card"><Users color="var(--color-accent)" /><div><strong>{rankedPlayers.length} players</strong><p className="muted" style={{ margin: 0 }}>Current participants ranked.</p></div></div>
              <div className="insight-card"><Trophy color="var(--color-warning)" /><div><strong>{leader?.username || 'No leader'}</strong><p className="muted" style={{ margin: 0 }}>{leader ? formatCurrency(leader.totalPortfolioValue, true) : 'No value yet'}</p></div></div>
              <div className="insight-card"><Wallet color="var(--color-success)" /><div><strong>{formatCurrency(averageValue, true)}</strong><p className="muted" style={{ margin: 0 }}>Average portfolio value.</p></div></div>
            </section>

            <section className="card card-pad stack">
              <div className="spread">
                <div>
                  <p className="eyebrow">Podium</p>
                  <h2 className="section-title" style={{ margin: 0 }}>Top performers</h2>
                </div>
                <Medal color="var(--color-warning)" />
              </div>
              <div className="podium-grid">
                {podium.map((player, index) => <PodiumCard key={player?.participantId || `podium-empty-${index}`} player={player} featured={player?.rank === 1} />)}
              </div>
            </section>

            <section className="card card-pad stack">
              <div>
                <p className="eyebrow">All ranks</p>
                <h2 className="section-title" style={{ margin: 0 }}>Contest standings</h2>
              </div>
              <div className="leaderboard-table">
                {rankedPlayers.map((player) => <LeaderboardRow key={player.participantId} player={player} />)}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default LeaderboardPage;
