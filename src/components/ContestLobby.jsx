import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, Flame, KeyRound, LineChart, LogOut, Plus, Shield, Sparkles, Trophy, Users, BellRing, Wallet, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/useAuthFetch';
import Modal from './Modal';
import CreateContestForm from './CreateContestForm';
import JoinContestForm from './JoinContestForm';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { CardSkeleton } from './ui/Skeleton';
import { createContest, getMyContests, getOpenPublicContests, joinContest, joinContestByCode, getMarketPulse, getSuggestedFormat, getPortfolio, getMarketTrending } from '../services/contestService';
import { logoutUser } from '../services/authService';

const formatCurrency = (value) => {
  const num = Number(value || 0);
  if (num >= 10000000) return `Rs. ${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `Rs. ${(num / 100000).toFixed(2)} Lac`;
  return `Rs. ${num.toLocaleString('en-IN')}`;
};

function TrendingCard({ type }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    let mounted = true;
    getMarketTrending()
      .then((res) => {
        if (mounted && res) setData(type === 'gainers' ? res.gainers : res.losers);
      })
      .catch((err) => console.error('Failed to fetch trending', err));
    return () => { mounted = false; };
  }, [type]);

  const isGainer = type === 'gainers';
  const title = isGainer ? 'Top Gainers' : 'Top Losers';
  const Icon = isGainer ? TrendingUp : TrendingDown;
  const colorVar = isGainer ? 'var(--color-success)' : 'var(--color-error)';

  return (
    <div className="card card-pad stack" style={{ minHeight: '8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="eyebrow" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={14} color="var(--color-accent)" /> {title}
          <span style={{ fontSize: '0.85em', opacity: 0.5, textTransform: 'none', letterSpacing: 'normal' }} title="Powered by Nifty Total Market Index">
            (Total Market)
          </span>
        </p>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
        {data.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6 }}>
             <Flame size={16} className="muted" />
             <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>Loading data...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.slice(0, 3).map((stock) => {
               const cleanSymbol = stock.symbol.replace('.NS', '');
               
               return (
                 <div key={stock.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <strong style={{ fontSize: 'var(--text-sm)' }}>{cleanSymbol}</strong>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: colorVar }}>
                     <Icon size={12} />
                     <strong style={{ fontSize: 'var(--text-sm)' }}>{Math.abs(stock.pChange).toFixed(1)}%</strong>
                   </div>
                 </div>
               )
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value.endsWith?.('Z') ? value : `${value}Z`);
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
};

const statusTone = {
  LIVE: 'live',
  OPEN: 'warning',
  COMPLETED: 'success',
};

function AppHeader({ onCreate, onJoin, onLogout }) {
  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand">
            <span className="brand-mark">P</span>
            <div>
              <h1 className="brand-title">Pickfolio</h1>
              <p className="brand-subtitle">Virtual market contests</p>
            </div>
          </div>
          <div className="desktop-actions">
            <Button variant="secondary" onClick={onJoin}><KeyRound size={18} /> Enter code</Button>
            <Button onClick={onCreate}><Plus size={18} /> Create</Button>
            <Button size="icon" variant="ghost" onClick={onLogout} aria-label="Log out"><LogOut size={18} /></Button>
          </div>
        </div>
      </header>
      <nav className="bottom-nav" aria-label="Primary actions">
        <button className="nav-link nav-link-active" type="button"><Trophy size={19} /> Lobby</button>
        <button className="nav-link" type="button" onClick={onJoin}><KeyRound size={19} /> Code</button>
        <button className="nav-link" type="button" onClick={onCreate}><Plus size={19} /> Create</button>
        <button className="nav-link" type="button" onClick={onLogout}><LogOut size={19} /> Logout</button>
      </nav>
    </>
  );
}

function ContestCard({ contest, actionLabel, onAction, isProcessing, currentUserId }) {
  const isCreator = contest.creatorId === currentUserId;
  const isLive = contest.status === 'LIVE';

  return (
    <Motion.article
      className="card card-pad card-interactive contest-card"
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="spread" style={{ alignItems: 'start' }}>
        <div className="stack" style={{ gap: 'var(--space-2)' }}>
          <Badge tone={statusTone[contest.status] || 'neutral'}>{contest.status}</Badge>
          <h3>{contest.name}</h3>
        </div>
        {contest.isPrivate ? <Shield size={20} color="var(--color-text-muted)" aria-label="Private contest" /> : null}
      </div>

      <div className="contest-meta">
        <div className="mini-stat"><span>Budget</span><strong>{formatCurrency(contest.virtualBudget)}</strong></div>
        <div className="mini-stat"><span>Players</span><strong>{contest.currentParticipants} / {contest.maxParticipants}</strong></div>
      </div>

      <div className="stack" style={{ gap: 'var(--space-2)' }}>
        <p className="cluster muted" style={{ margin: 0 }}><CalendarDays size={16} /> {formatDateTime(contest.startTime)}</p>
        <p className="cluster muted" style={{ margin: 0 }}><Clock3 size={16} /> {formatDateTime(contest.endTime)}</p>
      </div>

      {isCreator && contest.isPrivate && contest.status === 'OPEN' ? (
        <div className="mini-stat spread">
          <span>Invite code</span>
          <strong style={{ letterSpacing: '0.14em' }}>{contest.inviteCode}</strong>
        </div>
      ) : null}

      <Button variant={isLive ? 'default' : 'secondary'} onClick={() => onAction(contest.id)} disabled={isProcessing}>
        {isProcessing ? 'Working...' : actionLabel} <ArrowRight size={16} />
      </Button>
    </Motion.article>
  );
}

function EmptyState({ icon, title, message, action }) {
  const EmptyIcon = icon;
  return (
    <div className="empty-state">
      <EmptyIcon size={30} />
      <div>
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      {action}
    </div>
  );
}

function ContestSection({ title, contests, empty, children }) {
  return (
    <Motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <div className="spread" style={{ marginBottom: 'var(--space-4)' }}>
        <h2 className="section-title" style={{ margin: 0 }}>{title}</h2>
        {contests.length ? <span className="badge">{contests.length}</span> : null}
      </div>
      {contests.length ? <div className="contest-deck">{children}</div> : empty}
    </Motion.section>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  // Add vertical padding so the stroke doesn't get clipped
  const paddingY = 4;
  const drawHeight = height - paddingY * 2;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = paddingY + drawHeight - ((val - min) / range) * drawHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function MarketPulse() {
  const [rows, setRows] = useState([
    { symbol: 'NIFTY', move: '--', tone: 'var(--text-secondary)', sparkline: [] },
    { symbol: 'BANK', move: '--', tone: 'var(--text-secondary)', sparkline: [] },
    { symbol: 'IT', move: '--', tone: 'var(--text-secondary)', sparkline: [] },
  ]);

  useEffect(() => {
    getMarketPulse()
      .then((data) => {
        if (data && data.length > 0) {
          setRows(data);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch market pulse', err);
      });
  }, []);

  return (
    <Motion.section
      className="card card-pad stack market-pulse"
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.32 }}
    >
      <div className="spread">
        <div>
          <p className="eyebrow">Market pulse</p>
          <h2 className="section-title" style={{ margin: 0 }}>Today’s drift</h2>
        </div>
        <LineChart color="var(--color-accent)" />
      </div>
      {rows.map((row) => (
        <div className="pulse-row" key={row.symbol}>
          <strong>{row.symbol}</strong>
          <div className="sparkline" aria-hidden="true">
            <Sparkline data={row.sparkline} color={row.tone} />
          </div>
          <strong style={{ color: row.tone }}>{row.move}</strong>
        </div>
      ))}
    </Motion.section>
  );
}

function StrategyPrompt({ onCreate, authFetch }) {
  const [formats, setFormats] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!authFetch) return;
    getSuggestedFormat(authFetch)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setFormats(data);
        } else if (data && !Array.isArray(data)) {
          setFormats([data]);
        }
      })
      .catch((err) => console.error('Failed to fetch suggested format', err));
  }, [authFetch]);

  useEffect(() => {
    if (formats.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % formats.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [formats.length]);

  const format = formats[currentIndex];

  return (
    <Motion.section
      className="card card-pad spotlight-card"
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.32 }}
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div className="stack" style={{ position: 'relative', zIndex: 1, flexGrow: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Badge tone="success"><Sparkles size={14} /> Suggested format</Badge>
          {formats.length > 1 && (
            <div className="carousel-indicators" style={{ display: 'flex', gap: '4px' }}>
              {formats.map((_, i) => (
                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === currentIndex ? 'var(--color-success)' : 'var(--color-border)', transition: 'background 0.3s' }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ minHeight: '5.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <AnimatePresence mode="wait">
            {format ? (
              <Motion.div
                key={format.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="section-title" style={{ marginBottom: 'var(--space-2)' }}>{format.title}</h2>
                <p className="muted" style={{ margin: 0 }}>{format.description}</p>
              </Motion.div>
            ) : (
              <Motion.div key="loading">
                <h2 className="section-title" style={{ marginBottom: 'var(--space-2)' }}>Loading...</h2>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Button onClick={() => onCreate(format)} disabled={!format} style={{ position: 'relative', zIndex: 1, width: 'fit-content', marginTop: 'var(--space-4)' }}>
        Use this idea <ArrowRight size={16} />
      </Button>
    </Motion.section>
  );
}

function ActionCenter({ myContests, authFetch, navigate }) {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const generateAlerts = async () => {
      setIsLoading(true);
      const newAlerts = [];
      const now = new Date();

      const formatTimeLeft = (hours) => {
        if (hours < 1) {
          const mins = Math.max(1, Math.ceil(hours * 60));
          return `${mins} minute${mins !== 1 ? 's' : ''}`;
        }
        return `${Math.ceil(hours)} hour${Math.ceil(hours) !== 1 ? 's' : ''}`;
      };

      myContests.forEach(contest => {
        if (contest.status === 'LIVE') {
          const end = new Date(contest.endTime.endsWith('Z') ? contest.endTime : `${contest.endTime}Z`);
          const hoursLeft = (end - now) / (1000 * 60 * 60);
          if (hoursLeft > 0 && hoursLeft <= 48) {
            newAlerts.push({
              id: `end-${contest.id}`,
              tone: 'warning',
              icon: Clock3,
              title: 'Ending soon',
              message: `"${contest.name}" ends in ${formatTimeLeft(hoursLeft)}.`,
              contestId: contest.id
            });
          }
        } else if (contest.status === 'OPEN') {
          const start = new Date(contest.startTime.endsWith('Z') ? contest.startTime : `${contest.startTime}Z`);
          const hoursUntil = (start - now) / (1000 * 60 * 60);
          if (hoursUntil > 0 && hoursUntil <= 24) {
            newAlerts.push({
              id: `start-${contest.id}`,
              tone: 'neutral',
              icon: CalendarDays,
              title: 'Starting soon',
              message: `"${contest.name}" begins in ${formatTimeLeft(hoursUntil)}.`,
              contestId: contest.id
            });
          }
        }
      });

      const liveContests = myContests.filter(c => c.status === 'LIVE');
      for (const contest of liveContests) {
        try {
          const portfolio = await getPortfolio(authFetch, contest.id);
          if (!mounted) return;

          if (portfolio && portfolio.cashBalance > 0 && (portfolio.cashBalance / portfolio.totalPortfolioValue) > 0.4) {
            newAlerts.push({
              id: `cash-${contest.id}`,
              tone: 'warning',
              icon: Wallet,
              title: 'Idle cash detected',
              message: `You have ${formatCurrency(portfolio.cashBalance)} uninvested.`,
              contestId: contest.id
            });
          }

          if (portfolio && portfolio.holdings) {
            portfolio.holdings.forEach(h => {
              const totalCost = h.quantity * h.averageBuyPrice;
              if (totalCost > 0) {
                const pctChange = (h.profit / totalCost) * 100;
                if (pctChange <= -5) {
                  newAlerts.push({
                    id: `drop-${h.id}`,
                    tone: 'error',
                    icon: TrendingDown,
                    title: 'Position alert',
                    message: `${h.stockSymbol.replace('.NS', '')} dropped ${Math.abs(pctChange).toFixed(1)}%.`,
                    contestId: contest.id
                  });
                } else if (pctChange >= 5) {
                  newAlerts.push({
                    id: `up-${h.id}`,
                    tone: 'success',
                    icon: TrendingUp,
                    title: 'Momentum alert',
                    message: `${h.stockSymbol.replace('.NS', '')} is up ${pctChange.toFixed(1)}%.`,
                    contestId: contest.id
                  });
                }
              }
            });
          }
        } catch (err) {
          console.error(`Failed to fetch portfolio for ${contest.id}`, err);
        }
      }

      if (mounted) {
        newAlerts.sort((a, b) => {
          const tonePriority = { error: 3, warning: 2, success: 1, neutral: 0 };
          return (tonePriority[b.tone] || 0) - (tonePriority[a.tone] || 0);
        });
        setAlerts(newAlerts.slice(0, 5));
        setIsLoading(false);
      }
    };

    if (myContests.length > 0) {
      generateAlerts();
    } else {
      setIsLoading(false);
      setAlerts([]);
    }

    return () => { mounted = false; };
  }, [myContests, authFetch]);

  useEffect(() => {
    if (alerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % alerts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [alerts.length]);

  if (!isLoading && alerts.length === 0) return null;

  const currentAlert = alerts[currentIndex];
  const activeTone = currentAlert?.tone === 'neutral' ? 'neutral' : (currentAlert?.tone || 'live');
  const cssTone = activeTone === 'neutral' ? 'text-muted' : activeTone;

  return (
    <Motion.section
      className="grid-auto"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
    >
      <div 
        className="card card-pad card-interactive" 
        style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', cursor: 'pointer', minHeight: '8rem' }}
        onClick={() => currentAlert && navigate(`/contest/${currentAlert.contestId}`)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
          <p className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, color: `var(--color-${cssTone === 'text-muted' ? 'accent' : cssTone})` }}>
            <BellRing size={14} /> Smart alert
          </p>
          {alerts.length > 1 && (
            <div style={{ display: 'flex', gap: '4px' }}>
              {alerts.map((_, i) => (
                <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: i === currentIndex ? `var(--color-${cssTone === 'text-muted' ? 'accent' : cssTone})` : 'var(--color-border)', transition: 'background 0.3s' }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <AnimatePresence mode="wait">
            {currentAlert ? (
              <Motion.div
                key={currentAlert.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                style={{ width: '100%' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {(() => {
                    const Icon = currentAlert.icon;
                    return <Icon size={18} color={`var(--color-${cssTone})`} />;
                  })()}
                  <strong style={{ fontSize: 'var(--text-md)' }}>{currentAlert.title}</strong>
                </div>
                <p className="muted" style={{ margin: 0, fontSize: 'var(--text-sm)', lineHeight: 1.4 }}>{currentAlert.message}</p>
              </Motion.div>
            ) : (
              <Motion.div key="loading" style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                <BellRing size={18} className="muted" />
                <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>Scanning portfolio...</span>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <TrendingCard type="gainers" />
      <TrendingCard type="losers" />
    </Motion.section>
  );
}

function ContestLobby() {
  const navigate = useNavigate();
  const authFetch = useAuthFetch();
  const { userId, logout, tokens } = useAuth();
  const [myContests, setMyContests] = useState([]);
  const [publicContests, setPublicContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joiningContestId, setJoiningContestId] = useState(null);
  const [newlyCreatedContest, setNewlyCreatedContest] = useState(null);
  const [createFormInitialData, setCreateFormInitialData] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [mine, open] = await Promise.all([getMyContests(authFetch), getOpenPublicContests(authFetch)]);
      setMyContests(mine || []);
      setPublicContests(open || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const grouped = useMemo(() => {
    const live = [];
    const upcoming = [];
    const history = [];
    myContests.forEach((contest) => {
      if (contest.status === 'LIVE') live.push(contest);
      else if (contest.status === 'OPEN') upcoming.push(contest);
      else history.push(contest);
    });
    live.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
    upcoming.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    history.sort((a, b) => new Date(b.endTime) - new Date(a.endTime));
    return { live, upcoming, history };
  }, [myContests]);

  const availablePublicContests = useMemo(() => {
    const mine = new Set(myContests.map((contest) => contest.id));
    return publicContests.filter((contest) => !mine.has(contest.id)).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [myContests, publicContests]);

  const handleLogout = async () => {
    try {
      if (tokens?.refreshToken) await logoutUser(tokens.refreshToken);
    } catch {
      // Local logout still needs to happen if the server token is already invalid.
    } finally {
      logout();
    }
  };

  const handleCreateContest = async (contestData) => {
    setIsCreating(true);
    try {
      const created = await createContest(authFetch, contestData);
      setMyContests((current) => [created, ...current]);
      toast.success('Contest created.');
      if (created.isPrivate) setNewlyCreatedContest(created);
      else setShowCreateModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = async (inviteCode) => {
    setIsJoining(true);
    try {
      await joinContestByCode(authFetch, inviteCode);
      toast.success('Joined contest.');
      setShowJoinModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinPublic = async (contestId) => {
    setJoiningContestId(contestId);
    const contest = publicContests.find((item) => item.id === contestId);
    if (contest) setMyContests((current) => [contest, ...current]);
    try {
      await joinContest(authFetch, contestId);
      toast.success('Joined contest.');
      fetchData();
    } catch (err) {
      toast.error(err.message);
      fetchData();
    } finally {
      setJoiningContestId(null);
    }
  };

  const nextContest = grouped.live[0] || grouped.upcoming[0] || availablePublicContests[0];
  const activeLabel = grouped.live.length ? `${grouped.live.length} live now` : `${grouped.upcoming.length} upcoming`;

  return (
    <div className="app-shell page">
      <AppHeader onCreate={() => { setCreateFormInitialData(null); setShowCreateModal(true); }} onJoin={() => setShowJoinModal(true)} onLogout={handleLogout} />
      <main className="container page-main">
        <section className="lobby-hero">
          <div className="lobby-hero-inner">
            <Motion.div
              className="hero-copy"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, ease: 'easeOut' }}
            >
              <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.72)' }}>Contest lobby</p>
              <h1>Make the market a game.</h1>
              <p>Enter a live room, create a private challenge, or discover a public contest without digging through a dashboard.</p>
              <div className="hero-actions" style={{ marginTop: 'var(--space-5)' }}>
                <Button onClick={() => { setCreateFormInitialData(null); setShowCreateModal(true); }}><Plus size={18} /> Create contest</Button>
                <Button variant="secondary" onClick={() => setShowJoinModal(true)}><KeyRound size={18} /> Enter invite</Button>
              </div>
            </Motion.div>
            <Motion.div
              className="hero-strip"
              aria-label="Contest summary"
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.38, ease: 'easeOut' }}
            >
              <div className="hero-chip"><span>State</span><strong>{activeLabel}</strong></div>
              <div className="hero-chip"><span>Public rooms</span><strong>{availablePublicContests.length}</strong></div>
              <div className="hero-chip"><span>Next</span><strong>{nextContest ? formatDateTime(nextContest.startTime).split(',')[0] : 'Open'}</strong></div>
            </Motion.div>
          </div>
        </section>

        {error ? (
          <div className="alert alert-error spread">
            <span>Could not load contests: {error}</span>
            <Button variant="secondary" onClick={fetchData}>Retry</Button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid-auto">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="stack" style={{ gap: 'var(--space-10)' }}>
            <div className="lobby-overview">
              <StrategyPrompt authFetch={authFetch} onCreate={(data) => { setCreateFormInitialData(data); setShowCreateModal(true); }} />
              <MarketPulse />
            </div>

            <ActionCenter myContests={myContests} authFetch={authFetch} navigate={navigate} />

            <ContestSection
              title="Live contests"
              contests={grouped.live}
              empty={<EmptyState icon={Flame} title="No live contests" message="When a contest starts, it appears here with real-time portfolio movement." />}
            >
              <AnimatePresence>
                {grouped.live.map((contest) => <ContestCard key={contest.id} contest={contest} currentUserId={userId} onAction={(id) => navigate(`/contest/${id}`)} actionLabel="Enter dashboard" />)}
              </AnimatePresence>
            </ContestSection>

            <ContestSection
              title="My upcoming contests"
              contests={grouped.upcoming}
              empty={<EmptyState icon={CalendarDays} title="No upcoming contests" message="Create one or join a public contest to get started." action={<Button onClick={() => { setCreateFormInitialData(null); setShowCreateModal(true); }}><Plus size={18} /> Create contest</Button>} />}
            >
              <AnimatePresence>
                {grouped.upcoming.map((contest) => <ContestCard key={contest.id} contest={contest} currentUserId={userId} onAction={(id) => navigate(`/contest/${id}`)} actionLabel="View details" />)}
              </AnimatePresence>
            </ContestSection>

            <ContestSection
              title="Discover public contests"
              contests={availablePublicContests}
              empty={<EmptyState icon={Users} title="No public contests available" message="Private invite codes still work if a friend shared one with you." action={<Button variant="secondary" onClick={() => setShowJoinModal(true)}><KeyRound size={18} /> Enter code</Button>} />}
            >
              <AnimatePresence>
                {availablePublicContests.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} currentUserId={userId} onAction={handleJoinPublic} actionLabel="Join contest" isProcessing={joiningContestId === contest.id} />
                ))}
              </AnimatePresence>
            </ContestSection>

            {grouped.history.length ? (
              <ContestSection title="Completed contests" contests={grouped.history} empty={null}>
                <AnimatePresence>
                  {(showAllHistory ? grouped.history : grouped.history.slice(0, 3)).map((contest) => (
                    <ContestCard key={contest.id} contest={contest} currentUserId={userId} onAction={(id) => navigate(`/contest/${id}`)} actionLabel="View results" />
                  ))}
                </AnimatePresence>
                {grouped.history.length > 3 && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: 'var(--space-6)' }}>
                    <Button variant="secondary" onClick={() => setShowAllHistory(!showAllHistory)}>
                      {showAllHistory ? 'Show less' : `Show more (${grouped.history.length - 3} more)`}
                    </Button>
                  </div>
                )}
              </ContestSection>
            ) : null}
          </div>
        )}
      </main>

      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setNewlyCreatedContest(null); setCreateFormInitialData(null); }} title={newlyCreatedContest ? 'Share invite code' : 'Create contest'}>
        {newlyCreatedContest ? (
          <div className="stack">
            <div className="empty-state" style={{ minHeight: '11rem' }}>
              <CheckCircle2 size={32} color="var(--color-success)" />
              <h3>{newlyCreatedContest.name}</h3>
              <p>Share this code with players you want to invite.</p>
              <strong style={{ fontSize: 'var(--text-2xl)', letterSpacing: '0.16em' }}>{newlyCreatedContest.inviteCode}</strong>
            </div>
            <Button onClick={() => { navigator.clipboard.writeText(newlyCreatedContest.inviteCode); toast.success('Copied.'); }}>Copy code</Button>
          </div>
        ) : (
          <CreateContestForm key={createFormInitialData ? createFormInitialData.id : 'empty'} onSubmit={handleCreateContest} onCancel={() => setShowCreateModal(false)} isLoading={isCreating} initialData={createFormInitialData} />
        )}
      </Modal>

      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join private contest">
        <JoinContestForm onSubmit={handleJoinByCode} onCancel={() => setShowJoinModal(false)} isLoading={isJoining} />
      </Modal>
    </div>
  );
}

export default ContestLobby;
