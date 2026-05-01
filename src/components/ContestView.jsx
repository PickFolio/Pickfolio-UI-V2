import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Client as StompClient } from '@stomp/stompjs';
import { motion as Motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Activity, ArrowLeft, ArrowRight, BarChart3, CheckCircle2, LineChart, Lock, Search, ShieldCheck, Trophy, Wallet } from 'lucide-react';
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
            <p className="brand-subtitle">Contest dashboard</p>
            <h1 className="brand-title">{contest?.name || 'Contest'}</h1>
          </div>
        </div>
        <Badge tone={contest?.status === 'LIVE' ? 'live' : contest?.status === 'COMPLETED' ? 'success' : 'warning'}>{contest?.status || 'Loading'}</Badge>
      </div>
    </header>
  );
}

function SummaryStrip({ portfolio, contest }) {
  const profit = Number(portfolio?.totalProfitLoss || 0);
  return (
    <section className="dashboard-hero">
      <div className="card card-pad dashboard-summary">
        <div className="spread">
          <div>
            <p className="eyebrow">Overview</p>
            <h2 className="section-title" style={{ margin: 0 }}>{contest?.name || 'Contest'}</h2>
          </div>
          <Badge tone={contest?.status === 'LIVE' ? 'live' : 'warning'}>{contest?.status || 'OPEN'}</Badge>
        </div>
        <div className="metric-grid-compact">
          <div className="metric"><span className="metric-label">Portfolio</span><strong className="metric-value">{formatCurrency(portfolio?.totalPortfolioValue)}</strong></div>
          <div className="metric"><span className="metric-label">Cash</span><strong className="metric-value">{formatCurrency(portfolio?.cashBalance)}</strong></div>
          <div className="metric"><span className="metric-label">Holdings</span><strong className="metric-value">{formatCurrency(portfolio?.totalHoldingsValue)}</strong></div>
          <div className="metric"><span className="metric-label">P/L</span><strong className="metric-value" style={{ color: profit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>{formatCurrency(profit)}</strong></div>
        </div>
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
        <div><strong>{exposure}% deployed</strong><p className="muted" style={{ margin: 0 }}>Dummy risk guidance for now.</p></div>
      </div>
      <div className="insight-card">
        <Activity color="var(--color-success)" />
        <div><strong>{holdingsCount} active positions</strong><p className="muted" style={{ margin: 0 }}>Diversification signal.</p></div>
      </div>
      <div className="insight-card">
        <BarChart3 color="var(--color-warning)" />
        <div><strong>{daysLeft} days left</strong><p className="muted" style={{ margin: 0 }}>Contest timing context.</p></div>
      </div>
    </section>
  );
}

function HoldingsPanel({ portfolio }) {
  const holdings = portfolio?.holdings || [];
  return (
    <section className="card card-pad stack">
      <div className="spread">
        <div>
          <p className="eyebrow">Positions</p>
          <h2 className="section-title" style={{ margin: 0 }}>Holdings</h2>
        </div>
        <Wallet color="var(--color-accent)" />
      </div>
      {holdings.length ? (
        <div className="compact-list">
          {holdings.map((holding) => {
            const profit = Number(holding.profit || 0);
            return (
              <div className="compact-row" key={holding.id}>
                <Badge>{stripSymbol(holding.stockSymbol)}</Badge>
                <div style={{ minWidth: 0 }}>
                  <strong>{holding.quantity} shares</strong>
                  <p className="muted" style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Avg {formatCurrency(holding.averageBuyPrice)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>{formatCurrency(holding.currentValue, true)}</strong>
                  <p style={{ margin: 0, color: profit >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{formatCurrency(profit, true)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ minHeight: '11rem' }}>
          <Activity size={26} />
          <h3>No holdings yet</h3>
          <p>Your trades will appear here once this contest is live.</p>
        </div>
      )}
    </section>
  );
}

function MiniLeaderboard({ leaderboard, currentParticipantId, contestId }) {
  const topPlayers = leaderboard.slice(0, 5);
  return (
    <section className="card card-pad stack">
      <div className="spread">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h2 className="section-title" style={{ margin: 0 }}>Top players</h2>
        </div>
        <Link to={`/contest/${contestId}/leaderboard`} className="btn btn-secondary btn-sm">
          Full board <ArrowRight size={15} />
        </Link>
      </div>
      {topPlayers.length ? (
        <div className="compact-list">
          {topPlayers.map((player, index) => {
            const isMe = player.participantId === currentParticipantId;
            return (
              <div className="compact-row" key={player.participantId} style={isMe ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-soft)' } : undefined}>
                <span className="rank-pill">{index + 1}</span>
                <strong>{player.username}{isMe ? ' (You)' : ''}</strong>
                <strong>{formatCurrency(player.totalPortfolioValue, true)}</strong>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ minHeight: '10rem' }}>
          <Trophy size={26} />
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
    <section className="card card-pad stack">
      <div className="spread">
        <div>
          <p className="eyebrow">Trade</p>
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
            <div className="search-list" role="listbox">
              {isSearching ? <Skeleton style={{ height: '3rem' }} /> : null}
              {results.map((result) => (
                <button key={result.symbol} type="button" className="search-option" onClick={() => selectResult(result)}>
                  <span><strong>{stripSymbol(result.symbol)}</strong><br /><span className="muted">{result.name}</span></span>
                  <Badge>{result.symbol.endsWith('.NS') ? 'NSE' : 'BSE'}</Badge>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {symbol ? (
          <Motion.div className="stack" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="chart-box stack">
              <div className="spread">
                <div>
                  <strong>{stripSymbol(symbol)}</strong>
                  <p className="muted" style={{ margin: 0 }}>{isLoadingQuote ? 'Loading price...' : formatCurrency(currentPrice)}</p>
                </div>
                <div className="tabs" aria-label="Chart range">
                  {['1mo', '6mo', '1y'].map((item) => (
                    <button key={item} type="button" className={item === range ? 'tab tab-active' : 'tab'} onClick={() => setRange(item)}>{item.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              {isLoadingChart ? <Skeleton style={{ height: '15rem' }} /> : <StockChart data={chartData} height={220} />}
            </div>
          </Motion.div>
        ) : null}

        <div className="trade-type-grid" role="group" aria-label="Trade type">
          <Button variant={tradeType === 'BUY' ? 'default' : 'secondary'} onClick={() => setTradeType('BUY')}>Buy</Button>
          <Button variant={tradeType === 'SELL' ? 'default' : 'secondary'} onClick={() => setTradeType('SELL')}>Sell</Button>
        </div>

        <div className="grid-auto">
          <FormField id="quantity" label="Quantity" error={errors.quantity}>
            <Input id="quantity" type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} error={errors.quantity} />
          </FormField>
          <div className="metric">
            <span className="metric-label">Estimate</span>
            <strong className="metric-value">{formatCurrency(selectedValue)}</strong>
          </div>
        </div>

        <Button type="submit" className="btn-block" disabled={isSubmitting || !symbol || !currentPrice}>
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
    <div className="app-shell page">
      <DashboardHeader contest={contest} onBack={() => navigate('/')} />
      <main className="container page-main">
        {error && !portfolio ? (
          <div className="empty-state">
            <Lock size={30} />
            <h3>Could not open contest</h3>
            <p>{error}</p>
            <Button onClick={fetchData}>Retry</Button>
          </div>
        ) : null}

        {isLoading && !portfolio ? (
          <div className="stack">
            <CardSkeleton rows={3} />
            <CardSkeleton rows={4} />
            <CardSkeleton rows={5} />
          </div>
        ) : (
          <div className="grid-dashboard">
            <SummaryStrip portfolio={portfolio} contest={contest} />
            <InsightsPanel portfolio={portfolio} contest={contest} />
            <div className="dashboard-board">
              <div className="stack" style={{ gap: 'var(--space-4)' }}>
                {canTrade ? (
                  <TradeTerminal contestId={contestId} authFetch={authFetch} livePrices={livePrices} onTradeComplete={fetchData} />
                ) : (
                  <section className="empty-state">
                    <Lock size={28} />
                    <h3>Trading is closed</h3>
                    <p>This contest is {contest?.status?.toLowerCase() || 'not live'}; orders open only during live play.</p>
                  </section>
                )}
                <HoldingsPanel portfolio={portfolio} />
              </div>
              <div className="dashboard-side">
                <MiniLeaderboard leaderboard={sortedLeaderboard} currentParticipantId={portfolio?.participantId} contestId={contestId} />
                <section className="card card-pad stack">
                  <div className="spread">
                    <div>
                      <p className="eyebrow">Feed</p>
                      <h2 className="section-title" style={{ margin: 0 }}>Price stream</h2>
                    </div>
                    <CheckCircle2 color="var(--color-success)" />
                  </div>
                  <p className="muted" style={{ margin: 0 }}>
                    {Object.keys(livePrices).length ? `${Object.keys(livePrices).length} active symbols updating.` : 'Waiting for live price updates.'}
                  </p>
                </section>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ContestView;
