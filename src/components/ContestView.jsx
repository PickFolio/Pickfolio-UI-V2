import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Client as StompClient } from '@stomp/stompjs';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Activity, ArrowLeft, ArrowRight, BarChart3, CheckCircle2, LineChart, Lock, Search, ShieldCheck, Trophy, Wallet, Home, Briefcase, Zap, Clock, PieChart, Info, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/useAuthFetch';
import { executeTransaction, getContestDetails, getLeaderboard, getPortfolio, getStockHistory, getStockQuote, searchStocks, validateStockSymbol } from '../services/contestService';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { CardSkeleton, Skeleton } from './ui/Skeleton';
import { FormField } from './ui/FormField';
import { Input } from './ui/Input';
import { StockChart } from './StockChart';

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

const stripSymbol = (symbol = '') => symbol.replace('.NS', '').replace('.BO', '');

function DashboardHeader({ contest, onBack }) {
  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <div className="brand">
          <Button size="icon" variant="ghost" onClick={onBack} aria-label="Back to lobby"><ArrowLeft size={18} /></Button>
          <div>
            <p className="brand-subtitle">Contest</p>
            <h1 className="brand-title" style={{ fontSize: 'var(--text-lg)' }}>{contest?.name || 'Loading...'}</h1>
          </div>
        </div>

        <div>
           <Badge tone={contest?.status === 'LIVE' ? 'live' : contest?.status === 'COMPLETED' ? 'success' : 'warning'}>{contest?.status || '...'}</Badge>
        </div>
      </div>
    </header>
  );
}

function ContestBottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
    { id: 'trade', label: 'Trade', icon: Zap },
    { id: 'leaderboard', label: 'Rankings', icon: Trophy },
  ];

  return (
    <nav className="bottom-nav" aria-label="Contest tabs" style={{ zIndex: 100 }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <Icon size={19} /> {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function SummaryStrip({ portfolio }) {
  const profit = Number(portfolio?.totalProfitLoss || 0);
  const totalValue = Number(portfolio?.totalPortfolioValue || 0);
  const initialValue = totalValue - profit;
  const profitPct = initialValue > 0 ? (profit / initialValue) * 100 : 0;

  return (
    <section className="card card-pad stack">
      <div className="spread">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Total Value</p>
          <h2 style={{ fontSize: '1.8rem', margin: 0, letterSpacing: '-0.02em', fontWeight: '800' }}>{formatCurrency(totalValue, true)}</h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="eyebrow" style={{ margin: 0, marginBottom: '4px' }}>Return</p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ 
              color: profit >= 0 ? 'var(--color-success)' : 'var(--color-error)', 
              fontWeight: 'bold',
              fontSize: '1.1rem',
              lineHeight: 1
            }}>
              {profit >= 0 ? '+' : ''}{formatCurrency(profit, true)}
            </span>
            <span style={{ 
              background: profit >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: profit >= 0 ? 'var(--color-success)' : 'var(--color-error)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: 'var(--text-xs)',
              fontWeight: '700',
              lineHeight: 1
            }}>
              {profit >= 0 ? '+' : ''}{profitPct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      <div className="spread" style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
        <div>
           <p className="muted" style={{ margin: 0, fontSize: 'var(--text-xs)' }}>Available Cash</p>
           <strong style={{ fontSize: 'var(--text-sm)' }}>{formatCurrency(portfolio?.cashBalance, true)}</strong>
        </div>
        <div style={{ textAlign: 'right' }}>
           <p className="muted" style={{ margin: 0, fontSize: 'var(--text-xs)' }}>Invested</p>
           <strong style={{ fontSize: 'var(--text-sm)' }}>{formatCurrency(portfolio?.totalHoldingsValue, true)}</strong>
        </div>
      </div>
    </section>
  );
}

function PortfolioDiversification() {
  return (
    <section className="card card-pad">
      <p className="eyebrow" style={{ margin: '0 0 12px 0' }}>Allocation</p>
      <div style={{ height: '12px', width: '100%', display: 'flex', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
        <div style={{ width: '40%', background: 'var(--color-accent)' }} title="Tech: 40%"></div>
        <div style={{ width: '30%', background: 'var(--color-success)' }} title="Finance: 30%"></div>
        <div style={{ width: '20%', background: 'var(--color-warning)' }} title="Energy: 20%"></div>
        <div style={{ width: '10%', background: 'var(--color-text-muted)' }} title="Cash: 10%"></div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--color-text-soft)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--color-accent)'}}/> <strong>40%</strong> Tech</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--color-success)'}}/> <strong>30%</strong> Finance</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--color-warning)'}}/> <strong>20%</strong> Energy</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--color-text-muted)'}}/> <strong>10%</strong> Cash</span>
      </div>
    </section>
  );
}

function RecentActivity() {
  const activities = [
    { id: 1, title: 'Market Open', time: 'Today, 09:15 AM', icon: Clock },
    { id: 2, title: 'Portfolio Updated', time: 'Yesterday', icon: Info },
    { id: 3, title: 'Joined Contest', time: '2 days ago', icon: Zap },
  ];
  return (
    <section className="card card-pad stack">
      <div className="spread">
        <div>
          <p className="eyebrow">Timeline</p>
          <h2 className="section-title" style={{ margin: 0 }}>Recent Activity</h2>
        </div>
        <Activity color="var(--color-accent)" />
      </div>
      <div className="stack" style={{ gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
        {activities.map(act => {
          const Icon = act.icon;
          return (
            <div key={act.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
              <div style={{ background: 'var(--color-bg-alt)', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color="var(--color-text-muted)" />
              </div>
              <div style={{ paddingTop: '2px' }}>
                <strong style={{ display: 'block', fontSize: 'var(--text-md)', marginBottom: '2px' }}>{act.title}</strong>
                <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{act.time}</span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  );
}

function InsightsPanel({ portfolio, contest }) {
  const invested = Number(portfolio?.totalHoldingsValue || 0);
  const total = Number(portfolio?.totalPortfolioValue || 0);
  const exposure = total ? Math.round((invested / total) * 100) : 0;
  const daysLeft = contest?.endTime ? Math.max(0, Math.ceil((new Date(`${contest.endTime}`) - new Date()) / 86400000)) : 0;
  const holdingsCount = portfolio?.holdings?.length || 0;

  return (
    <section className="insight-grid">
      <div className="insight-card">
        <ShieldCheck color="var(--color-accent)" />
        <div><strong>{exposure}% deployed</strong><p className="muted" style={{ margin: 0 }}>Capital risk exposure.</p></div>
      </div>
      <div className="insight-card">
        <Activity color="var(--color-success)" />
        <div><strong>{holdingsCount} positions</strong><p className="muted" style={{ margin: 0 }}>Active diversification.</p></div>
      </div>
      <div className="insight-card">
        <BarChart3 color="var(--color-warning)" />
        <div><strong>{daysLeft} days left</strong><p className="muted" style={{ margin: 0 }}>Contest duration remaining.</p></div>
      </div>
    </section>
  );
}

function HoldingsPanel({ portfolio }) {
  const holdings = portfolio?.holdings || [];
  return (
    <section className="stack">
      <div className="spread" style={{ padding: '0 var(--space-2)' }}>
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Positions</p>
          <h2 className="section-title" style={{ margin: 0 }}>My Holdings</h2>
        </div>
        <Wallet color="var(--color-accent)" />
      </div>
      {holdings.length ? (
        <div className="stack" style={{ gap: 'var(--space-3)' }}>
          {holdings.map((holding) => {
            const profit = Number(holding.profit || 0);
            const profitPct = holding.buyValue > 0 ? (profit / holding.buyValue) * 100 : 0;
            return (
              <div className="card card-pad" key={holding.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <strong style={{ fontSize: 'var(--text-lg)', lineHeight: 1.2 }}>{stripSymbol(holding.stockSymbol)}</strong>
                   <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>{holding.quantity} shares @ {formatCurrency(holding.averageBuyPrice, true)}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: 'var(--text-lg)', display: 'block', lineHeight: 1.2 }}>{formatCurrency(holding.currentValue, true)}</strong>
                  <span style={{ 
                     color: profit >= 0 ? 'var(--color-success)' : 'var(--color-error)', 
                     fontSize: 'var(--text-sm)', 
                     fontWeight: '600',
                     display: 'flex',
                     justifyContent: 'flex-end',
                     gap: '4px'
                  }}>
                     {profit >= 0 ? '+' : ''}{formatCurrency(profit, true)} 
                     <span style={{ 
                        background: profit >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                     }}>
                        {profit >= 0 ? '+' : ''}{profitPct.toFixed(2)}%
                     </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card card-pad empty-state" style={{ minHeight: '15rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Activity size={32} style={{ marginBottom: 'var(--space-3)', color: 'var(--color-text-muted)' }} />
          <h3>No holdings yet</h3>
          <p>Go to the Trade tab to make your first investment.</p>
        </div>
      )}
    </section>
  );
}

function LeaderboardPanel({ leaderboard, currentParticipantId, contestId }) {
  return (
    <section className="stack desktop-leaderboard">
      <div className="spread" style={{ padding: '0 var(--space-2)' }}>
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>Rankings</p>
          <h2 className="section-title" style={{ margin: 0 }}>Leaderboard</h2>
        </div>
        <Trophy color="var(--color-accent)" />
      </div>
      {leaderboard.length ? (
        <div className="stack" style={{ gap: 'var(--space-3)' }}>
          {leaderboard.map((player, index) => {
            const isMe = player.participantId === currentParticipantId;
            return (
              <div className="card card-pad" key={player.participantId} style={{ 
                 display: 'flex', 
                 justifyContent: 'space-between', 
                 alignItems: 'center',
                 borderColor: isMe ? 'var(--color-accent)' : 'var(--color-border)', 
                 background: isMe ? 'var(--color-accent-soft)' : 'var(--color-surface)',
                 borderWidth: isMe ? '2px' : '1px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="rank-pill" style={{ width: '36px', height: '36px', fontSize: 'var(--text-md)', background: index < 3 ? 'var(--color-accent)' : 'var(--color-surface-2)', color: index < 3 ? '#fff' : 'var(--color-text-muted)' }}>{index + 1}</span>
                  <div style={{ marginLeft: 'var(--space-3)' }}>
                    <strong style={{ fontSize: 'var(--text-lg)', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.2 }}>
                      {player.username}
                      {player.isBot && <Bot size={16} color="var(--color-accent)" title={`AI Bot (${player.personaType || 'General'})`} />}
                    </strong>
                    {isMe && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', fontWeight: 'bold' }}>YOU</span>}
                    {player.isBot && !isMe && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{player.personaType?.replace('_', ' ')} Strategy</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <strong style={{ fontSize: 'var(--text-lg)', display: 'block', lineHeight: 1.2 }}>{formatCurrency(player.totalPortfolioValue, true)}</strong>
                </div>
              </div>
            );
          })}
          {leaderboard.length > 3 && (
            <Link to={`/contest/${contestId}/leaderboard`} className="btn btn-secondary desktop-only" style={{ width: '100%', marginTop: 'var(--space-2)' }}>
              View full leaderboard
            </Link>
          )}
        </div>
      ) : (
        <div className="card card-pad empty-state" style={{ minHeight: '15rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Trophy size={32} style={{ marginBottom: 'var(--space-3)', color: 'var(--color-text-muted)' }} />
          <h3>No rankings yet</h3>
          <p>Scores will appear after participants start trading.</p>
        </div>
      )}
    </section>
  );
}

function TradeTerminal({ contestId, authFetch, livePrices, onTradeComplete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [tradeType, setTradeType] = useState('BUY');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState('1mo');
  const [showChart, setShowChart] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.trim().length < 2 || searchTerm === symbol) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        setResults(await searchStocks(authFetch, searchTerm.trim()));
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [authFetch, searchTerm, symbol]);

  useEffect(() => {
    if (!symbol) return;
    const load = async () => {
      setIsLoadingQuote(true);
      setIsLoadingChart(true);
      setErrors((current) => ({ ...current, symbol: '' }));
      try {
        const validation = await validateStockSymbol(symbol);
        if (!validation?.isValid) {
          setErrors((current) => ({ ...current, symbol: 'This stock symbol is not valid.' }));
          setCurrentPrice(null);
          setChartData([]);
          return;
        }
        const [quote, history] = await Promise.all([
          getStockQuote(authFetch, symbol),
          getStockHistory(authFetch, symbol, range, '1d'),
        ]);
        setCurrentPrice(quote?.price ?? null);
        setChartData(history || []);
      } catch (err) {
        setErrors((current) => ({ ...current, symbol: err.message }));
      } finally {
        setIsLoadingQuote(false);
        setIsLoadingChart(false);
      }
    };
    load();
  }, [authFetch, range, symbol]);

  useEffect(() => {
    if (symbol && livePrices?.[symbol]) setCurrentPrice(livePrices[symbol]);
  }, [livePrices, symbol]);

  const selectedValue = Number(currentPrice || 0) * Number(quantity || 0);

  const selectResult = (result) => {
    setSymbol(result.symbol);
    setSearchTerm(result.symbol);
    setResults([]);
    setShowChart(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!symbol) nextErrors.symbol = 'Select a stock from search.';
    if (Number(quantity) <= 0) nextErrors.quantity = 'Quantity must be at least 1.';
    if (!currentPrice) nextErrors.symbol = nextErrors.symbol || 'Price is unavailable for this symbol.';
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      await executeTransaction(authFetch, contestId, { stockSymbol: symbol, transactionType: tradeType, quantity: Number(quantity) });
      toast.success(`${tradeType === 'BUY' ? 'Bought' : 'Sold'} ${quantity} ${stripSymbol(symbol)}.`);
      setQuantity('1');
      onTradeComplete();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card card-pad stack" style={{ minHeight: '60vh' }}>
      <div className="spread">
        <div>
          <p className="eyebrow">Execute</p>
          <h2 className="section-title" style={{ margin: 0 }}>Order ticket</h2>
        </div>
        <LineChart color="var(--color-accent)" />
      </div>

      <form className="stack" onSubmit={handleSubmit} noValidate>
        <div style={{ position: 'relative' }}>
          <FormField id="stock-search" label="Search stock" error={errors.symbol}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '0.9rem', color: 'var(--color-text-muted)' }} />
              <Input id="stock-search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setSymbol(''); }} placeholder="RELIANCE.NS" style={{ paddingLeft: '2.5rem' }} error={errors.symbol} autoComplete="off" />
            </div>
          </FormField>
          {(results.length || isSearching) ? (
            <div className="search-list" role="listbox" style={{ position: 'absolute', width: '100%', zIndex: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              {isSearching ? <div style={{ padding: '1rem' }}><Skeleton style={{ height: '3rem' }} /></div> : null}
              {results.map((result) => (
                <button key={result.symbol} type="button" className="search-option" onClick={() => selectResult(result)} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--color-border)', width: '100%', background: 'var(--color-surface)', borderLeft: 'none', borderRight: 'none', borderTop: 'none', textAlign: 'left', cursor: 'pointer' }}>
                  <span><strong style={{ display: 'block' }}>{stripSymbol(result.symbol)}</strong><span className="muted" style={{ fontSize: 'var(--text-xs)' }}>{result.name}</span></span>
                  <Badge style={{ alignSelf: 'center' }}>{result.symbol.endsWith('.NS') ? 'NSE' : 'BSE'}</Badge>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {symbol ? (
          <Motion.div className="stack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', background: 'var(--color-surface-2)' }} className="stack">
              <div className="spread" style={{ alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: 'var(--text-lg)' }}>{stripSymbol(symbol)}</strong>
                  <p className="muted" style={{ margin: 0, fontSize: 'var(--text-md)' }}>{isLoadingQuote ? 'Loading price...' : formatCurrency(currentPrice)}</p>
                </div>
                <button type="button" onClick={() => setShowChart(!showChart)} style={{ background: showChart ? 'var(--color-accent-soft)' : 'transparent', border: 'none', color: showChart ? 'var(--color-accent)' : 'var(--color-text-muted)', padding: '6px', cursor: 'pointer', borderRadius: 'var(--radius-md)', transition: 'background var(--ease), color var(--ease)' }} title="Toggle Chart">
                  <LineChart size={20} />
                </button>
              </div>
              <AnimatePresence>
                {showChart && (
                  <Motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ paddingTop: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '12px' }}>
                        {[ {id:'1mo', label:'1m'}, {id:'6mo', label:'6m'}, {id:'1y', label:'1y'} ].map((item) => (
                          <button key={item.id} type="button" onClick={() => setRange(item.id)} style={{ background: 'transparent', border: 'none', padding: '0 0 2px 0', fontSize: 'var(--text-sm)', fontWeight: item.id === range ? '800' : '600', color: item.id === range ? 'var(--color-accent)' : 'var(--color-text-muted)', cursor: 'pointer', borderBottom: item.id === range ? '2px solid var(--color-accent)' : '2px solid transparent', transition: 'border-color var(--ease), color var(--ease)' }}>{item.label}</button>
                        ))}
                      </div>
                      {isLoadingChart ? (
                         <div style={{ height: '220px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '4px', padding: '10px 0' }}>
                            {[30, 45, 25, 60, 40, 75, 50, 85, 65, 100, 70, 90].map((h, i) => <Skeleton key={i} style={{ flex: 1, height: `${h}%`, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, opacity: 0.5 }} />)}
                         </div>
                      ) : <StockChart data={chartData} height={220} />}
                    </div>
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </Motion.div>
        ) : null}

        <div className="trade-type-grid" role="group" aria-label="Trade type" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Button variant={tradeType === 'BUY' ? 'default' : 'secondary'} onClick={() => setTradeType('BUY')} style={{ background: tradeType === 'BUY' ? 'var(--color-success)' : undefined }}>Buy</Button>
          <Button variant={tradeType === 'SELL' ? 'default' : 'secondary'} onClick={() => setTradeType('SELL')} style={{ background: tradeType === 'SELL' ? 'var(--color-error)' : undefined }}>Sell</Button>
        </div>

        <div className="grid-auto" style={{ gap: 'var(--space-3)' }}>
          <FormField id="quantity" label="Quantity" error={errors.quantity}>
            <Input id="quantity" type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} error={errors.quantity} />
          </FormField>
          <div className="metric" style={{ background: 'var(--color-bg-alt)', padding: 'var(--space-2)', borderRadius: '6px' }}>
            <span className="metric-label" style={{ fontSize: 'var(--text-xs)' }}>Order Value Estimate</span>
            <strong className="metric-value" style={{ fontSize: 'var(--text-lg)' }}>{formatCurrency(selectedValue)}</strong>
          </div>
        </div>

        <Button type="submit" className="btn-block" disabled={isSubmitting || !symbol || !currentPrice} style={{ padding: '14px', fontSize: 'var(--text-md)' }}>
          {isSubmitting ? 'Processing...' : `Confirm ${tradeType.toLowerCase()}`}
        </Button>
      </form>
    </section>
  );
}

function ContestView({ contestId }) {
  const navigate = useNavigate();
  const authFetch = useAuthFetch();
  const { tokens } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [contest, setContest] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = useCallback(async ({ showLoading = false } = {}) => {
    setError('');
    if (showLoading) setIsLoading(true);
    try {
      const [portfolioData, leaderboardData, contestData] = await Promise.all([
        getPortfolio(authFetch, contestId),
        getLeaderboard(authFetch, contestId),
        getContestDetails(authFetch, contestId),
      ]);
      setPortfolio(portfolioData);
      setLeaderboard(leaderboardData || []);
      setContest(contestData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, contestId]);

  useEffect(() => {
    fetchData({ showLoading: true });
  }, [fetchData]);

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

      stompClient.subscribe('/topic/live-prices', (message) => {
        const prices = JSON.parse(message.body);
        setLivePrices(prices);
        setPortfolio((current) => {
          if (!current?.holdings?.length) return current;
          let changed = false;
          const holdings = current.holdings.map((holding) => {
            const nextPrice = prices[holding.stockSymbol];
            if (nextPrice === undefined) return holding;
            changed = true;
            const currentValue = Number(nextPrice) * Number(holding.quantity);
            return { ...holding, currentPrice: nextPrice, currentValue, profit: currentValue - Number(holding.buyValue) };
          });
          if (!changed) return current;
          const totalHoldingsValue = holdings.reduce((sum, holding) => sum + Number(holding.currentValue), 0);
          const totalPortfolioValue = Number(current.cashBalance) + totalHoldingsValue;
          const totalProfitLoss = holdings.reduce((sum, holding) => sum + Number(holding.profit), 0);
          return { ...current, holdings, totalHoldingsValue, totalPortfolioValue, totalProfitLoss };
        });
      });
    };

    stompClient.activate();
    return () => stompClient.deactivate();
  }, [contestId, tokens?.accessToken]);

  const canTrade = contest?.status === 'LIVE';
  const sortedLeaderboard = useMemo(() => [...leaderboard].sort((a, b) => Number(b.totalPortfolioValue) - Number(a.totalPortfolioValue)), [leaderboard]);

  return (
    <div className="app-shell page" style={{ paddingBottom: '80px' }}>
      <DashboardHeader contest={contest} onBack={() => navigate('/')} />
      
      <main className="page-main" style={{ padding: 0 }}>
        {error && !portfolio ? (
          <div className="container" style={{ paddingTop: 'var(--space-4)' }}>
            <div className="empty-state">
              <Lock size={30} />
              <h3>Could not open contest</h3>
              <p>{error}</p>
              <Button onClick={fetchData}>Retry</Button>
            </div>
          </div>
        ) : isLoading && !portfolio ? (
          <div className="container stack" style={{ paddingTop: 'var(--space-4)' }}>
            <CardSkeleton rows={3} />
            <CardSkeleton rows={4} />
          </div>
        ) : (
          <>
            <div className="container" style={{ paddingTop: 'var(--space-5)', paddingBottom: 'var(--space-5)' }}>
              <div className="dashboard-grid">
                {/* Left Column: Dashboard Core & Portfolio */}
                <div className="stack" style={{ gap: 'var(--space-5)' }}>
                  <div className={`mobile-tab-content ${activeTab === 'overview' ? 'is-active' : ''}`}>
                    <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                      <div className="stack" style={{ gap: 'var(--space-5)' }}>
                        <SummaryStrip portfolio={portfolio} />
                        <InsightsPanel portfolio={portfolio} contest={contest} />
                        <PortfolioDiversification />
                        <div className="mobile-only">
                          <RecentActivity />
                        </div>
                      </div>
                    </Motion.div>
                  </div>

                  <div className={`mobile-tab-content ${activeTab === 'portfolio' ? 'is-active' : ''}`}>
                    <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                       <HoldingsPanel portfolio={portfolio} />
                    </Motion.div>
                  </div>
                </div>

                {/* Right Column: Execution & Competition */}
                <div className="stack" style={{ gap: 'var(--space-5)', position: 'sticky', top: '6rem' }}>
                  <div className={`mobile-tab-content ${activeTab === 'trade' ? 'is-active' : ''}`}>
                    <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                      {canTrade ? (
                        <TradeTerminal contestId={contestId} authFetch={authFetch} livePrices={livePrices} onTradeComplete={fetchData} />
                      ) : (
                        <section className="empty-state">
                          <Lock size={28} />
                          <h3>Trading is closed</h3>
                          <p>This contest is {contest?.status?.toLowerCase() || 'not live'}; orders open only during live play.</p>
                        </section>
                      )}
                    </Motion.div>
                  </div>

                  <div className={`mobile-tab-content ${activeTab === 'leaderboard' ? 'is-active' : ''}`}>
                    <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                      <LeaderboardPanel leaderboard={sortedLeaderboard} currentParticipantId={portfolio?.participantId} contestId={contestId} />
                    </Motion.div>
                  </div>
                  
                  <div className="desktop-only">
                    <RecentActivity />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <ContestBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default ContestView;
