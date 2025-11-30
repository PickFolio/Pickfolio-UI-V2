import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/useAuthFetch';
import { getPortfolio, getLeaderboard, executeTransaction, getStockQuote, getContestDetails, searchStocks } from '../services/contestService';
import { Client as StompClient } from '@stomp/stompjs';
import styles from './ContestView.module.css';
import toast from 'react-hot-toast';
import Spinner from './Spinner';

const CONTEST_WS_URL = import.meta.env.VITE_CONTEST_WS_URL;

const formatSymbol = (symbol) => symbol ? symbol.replace('.NS', '') : '';

const PortfolioView = ({ portfolio }) => {
    const formatCurrency = (value) => {
        if (value === null || typeof value === 'undefined') return '---';
        return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getPLColor = (value) => {
        if (value === null || typeof value === 'undefined') return 'textNeutral';
        return value >= 0 ? 'textGreen' : 'textRed';
    };

    return (
        <div className={styles.widget}>
            <h2 className={styles.widgetTitle}>My Portfolio</h2>
            <div className={styles.summaryGrid}>
                <div>
                    <p className={styles.summaryLabel}>Total Value</p>
                    <p className={styles.summaryValue}>{formatCurrency(portfolio?.totalPortfolioValue)}</p>
                </div>
                <div>
                    <p className={styles.summaryLabel}>Holdings Value</p>
                    <p className={styles.summaryValue}>{formatCurrency(portfolio?.totalHoldingsValue)}</p>
                </div>
                <div>
                    <p className={styles.summaryLabel}>Cash Balance</p>
                    <p className={styles.summaryValue}>{formatCurrency(portfolio?.cashBalance)}</p>
                </div>
                <div>
                    <p className={styles.summaryLabel}>Total P/L</p>
                    <p className={`${styles.summaryValue} ${getPLColor(portfolio?.totalProfitLoss)}`}>{formatCurrency(portfolio?.totalProfitLoss)}</p>
                </div>
            </div>
            <h3 className={styles.holdingsTitle}>My Holdings</h3>
            <div className={styles.tableContainer}>
                <table>
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Qty</th>
                            <th>Avg. Buy</th>
                            <th>LTP</th>
                            <th>P/L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(portfolio?.holdings || []).length === 0 && (
                            <tr><td colSpan="5">You have no holdings.</td></tr>
                        )}
                        {(portfolio?.holdings || []).map(h => (
                            <tr key={h.id}>
                                <td>{formatSymbol(h.stockSymbol)}</td>
                                <td>{h.quantity}</td>
                                <td>{formatCurrency(h.averageBuyPrice)}</td>
                                <td>{formatCurrency(h.currentPrice)}</td>
                                <td className={getPLColor(h.profit)}>{formatCurrency(h.profit)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Leaderboard = ({ leaderboard, currentParticipantId }) => (
    <div className={styles.widget}>
        <h2 className={styles.widgetTitle}>Leaderboard</h2>
        <ol className={styles.leaderboardList}>
            {leaderboard.map((player, index) => (
                <li key={player.participantId} className={player.participantId === currentParticipantId ? styles.leaderboardItemYou : styles.leaderboardItem}>
                    <div className={styles.leaderboardRank}>
                        <span>{index + 1}</span>
                        <span className={styles.leaderboardName}>{player.username}</span>
                    </div>
                    <span className={styles.leaderboardValue}>₹{Number(player.totalPortfolioValue).toLocaleString('en-IN')}</span>
                </li>
            ))}
        </ol>
    </div>
);

const TradeWidget = ({ contestId, onTransactionSuccess, authFetch, livePrices }) => {
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [tradeType, setTradeType] = useState('BUY');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentPrice, setCurrentPrice] = useState(null);
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);

    // Dynamic Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // 1. Debounced Search Effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }

            try {
                const results = await searchStocks(authFetch, searchTerm);
                setSearchResults(results || []);
                setShowDropdown(true);
            } catch (err) {
                console.error("Search failed", err);
            }
        }, 300); // 300ms delay

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, authFetch]);

    // 2. Fetch Price Effect (Same as before, but handles symbol selection)
    useEffect(() => {
        const fetchPrice = async () => {
            if (!symbol) {
                setCurrentPrice(null);
                return;
            }

            // Check live feed first
            if (livePrices && livePrices[symbol]) {
                setCurrentPrice(livePrices[symbol]);
                return;
            }

            setIsFetchingPrice(true);
            try {
                const quote = await getStockQuote(authFetch, symbol);
                setCurrentPrice(quote.price);
            } catch (err) {
                console.error("Failed to fetch quote", err);
                setCurrentPrice(null);
            } finally {
                setIsFetchingPrice(false);
            }
        };

        // Fetch immediately if symbol is set
        fetchPrice();
    }, [symbol, authFetch]);

    // Update price from live feed if available
    useEffect(() => {
        if (!symbol) return;
        if (livePrices && livePrices[symbol]) {
            setCurrentPrice(livePrices[symbol]);
        }
    }, [livePrices, symbol]);


    const handleSymbolSelect = (result) => {
        setSymbol(result.symbol); // Store the actual symbol (e.g., RELIANCE.NS)
        setSearchTerm(result.symbol); // Show symbol in box
        setSearchResults([]); // Clear results
        setShowDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const promise = executeTransaction(authFetch, contestId, {
            stockSymbol: symbol, // Use the selected symbol directly
            transactionType: tradeType,
            quantity: parseInt(quantity, 10),
        });

        try {
            await toast.promise(promise, {
                loading: 'Processing transaction...',
                success: () => {
                    setSymbol('');
                    setSearchTerm('');
                    setQuantity('1');
                    setCurrentPrice(null);
                    onTransactionSuccess();
                    return <b>Transaction successful!</b>;
                },
                error: (err) => <b>{err.message || 'Transaction failed.'}</b>,
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const estimatedValue = currentPrice ? (currentPrice * parseInt(quantity || 0, 10)) : 0;

    return (
        <div className={styles.widget}>
            <h2 className={styles.widgetTitle}>Place a Trade</h2>
            {error && <div className={styles.errorBox}>{error}</div>}
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.tradeGrid}>
                    <div className={styles.dropdownContainer}>
                        <label htmlFor="symbol" className={styles.inputLabel}>Stock Search</label>
                        <input
                            type="text"
                            id="symbol"
                            value={searchTerm}
                            onChange={e => {
                                setSearchTerm(e.target.value);
                                // Only clear symbol if user types manually to force re-selection or re-validation
                                if (e.target.value !== symbol) setSymbol('');
                            }}
                            onFocus={() => { if(searchResults.length > 0) setShowDropdown(true); }}
                            // Delay blur to allow click on dropdown item
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            required
                            className={styles.input}
                            placeholder="Type to search (e.g. Tata)"
                            autoComplete="off"
                        />

                        {/* Dynamic Dropdown */}
                        {showDropdown && searchResults.length > 0 && (
                            <ul className={styles.dropdownList}>
                                {searchResults.map((result) => (
                                    <li
                                        key={result.symbol}
                                        onClick={() => handleSymbolSelect(result)}
                                        className={styles.dropdownItem}
                                    >
                                        <div style={{fontWeight: 'bold'}}>{result.symbol}</div>
                                        <div style={{fontSize: '0.8em', color: '#ccc'}}>{result.name}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div>
                        <label htmlFor="quantity" className={styles.inputLabel}>Quantity</label>
                        <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required min="1" className={styles.input} />
                    </div>
                    <div className={styles.tradeButtons}>
                        <button type="button" onClick={() => setTradeType('BUY')} className={`${styles.button} ${tradeType === 'BUY' ? styles.buyActive : ''}`}>BUY</button>
                        <button type="button" onClick={() => setTradeType('SELL')} className={`${styles.button} ${tradeType === 'SELL' ? styles.sellActive : ''}`}>SELL</button>
                    </div>
                </div>

                {symbol && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(15, 23, 42, 0.3)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {isFetchingPrice ? 'Fetching price...' : (currentPrice ? `Price: ₹${currentPrice.toFixed(2)}` : 'Loading...')}
                        </span>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            Total: {currentPrice ? `₹${estimatedValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '---'}
                        </span>
                    </div>
                )}

                <button type="submit" disabled={isLoading || !symbol} className={styles.executeButton}>
                    {isLoading ? 'Processing...' : `Execute ${tradeType}`}
                </button>
            </form>
        </div>
    );
};


const ContestView = ({ contestId }) => {
    const [portfolio, setPortfolio] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [contest, setContest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [livePrices, setLivePrices] = useState({});

    const navigate = useNavigate();
    const authFetch = useAuthFetch();
    const { tokens } = useAuth();

    const fetchInitialData = useCallback(async () => {
        try {
            // Don't set full page loading for subsequent refreshes, only initial
            if (!portfolio) setIsLoading(true);
            setError(null);
            // Fetch contest details to check status
            const [portfolioData, leaderboardData, contestData] = await Promise.all([
                getPortfolio(authFetch, contestId),
                getLeaderboard(authFetch, contestId),
                getContestDetails(authFetch, contestId)
            ]);
            setPortfolio(portfolioData);
            setLeaderboard(leaderboardData || []);
            setContest(contestData);
        } catch (err) {
            setError(err.message || "Failed to load contest data.");
        } finally {
            setIsLoading(false);
        }
    }, [contestId, authFetch]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // WebSocket Connection
    useEffect(() => {
        if (!tokens?.accessToken || !contestId) return;

        const stompClient = new StompClient({
            brokerURL: CONTEST_WS_URL,
            connectHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
            reconnectDelay: 5000,
        });

        stompClient.onConnect = () => {
            // 1. Leaderboard Updates
            stompClient.subscribe(`/topic/contest/${contestId}`, (message) => {
                const update = JSON.parse(message.body);
                setLeaderboard(prev =>
                    prev.map(p =>
                        p.participantId === update.participantId
                        ? { ...p, totalPortfolioValue: update.totalPortfolioValue }
                        : p
                    ).sort((a, b) => b.totalPortfolioValue - a.totalPortfolioValue)
                );
            });

            // 2. Live Price Updates
            stompClient.subscribe('/topic/live-prices', (message) => {
                const prices = JSON.parse(message.body);
                setLivePrices(prices);

                setPortfolio(prev => {
                    if (!prev || !prev.holdings) return prev;
                    let hasUpdates = false;
                    // Recalculate each holding based on new prices
                    const updatedHoldings = prev.holdings.map(h => {
                        const newPrice = prices[h.stockSymbol];
                        if (newPrice !== undefined) {
                            hasUpdates = true;
                            const currentPrice = newPrice;
                            const currentValue = currentPrice * h.quantity;
                            const profit = currentValue - h.buyValue;
                            return { ...h, currentPrice, currentValue, profit };
                        }
                        return h;
                    });

                    if (!hasUpdates) return prev;

                    const totalHoldingsValue = updatedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
                    const totalPortfolioValue = Number(prev.cashBalance) + totalHoldingsValue;
                    const totalProfitLoss = updatedHoldings.reduce((sum, h) => sum + h.profit, 0);

                    return { ...prev, holdings: updatedHoldings, totalHoldingsValue, totalPortfolioValue, totalProfitLoss };
                });
            });
        };

        stompClient.activate();
        return () => stompClient.deactivate();
    }, [contestId, tokens]);

    if (isLoading && !portfolio) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <Spinner />
        </div>
    );
    if (error && !portfolio) return <p className={styles.error}>Error: {error}</p>;

    return (
        <div className={styles.container}>
             <header className={styles.header}>
                <button onClick={() => navigate('/')} className={styles.backButton}>&larr; Back to Lobby</button>
                <h1 className={styles.title}>{contest?.name || 'Contest View'}</h1>
             </header>
            <div className={styles.mainGrid}>
                <div className={styles.leftColumn}>
                    <PortfolioView portfolio={portfolio} />

                    {/* FIX: Only show trade widget if contest is LIVE */}
                    {contest?.status === 'LIVE' && (
                        <TradeWidget
                            contestId={contestId}
                            onTransactionSuccess={fetchInitialData}
                            authFetch={authFetch}
                            livePrices={livePrices}
                        />
                    )}
                    {contest?.status !== 'LIVE' && (
                        <div className={styles.widget} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <p>Trading is currently closed for this contest.</p>
                        </div>
                    )}
                </div>
                <div className={styles.rightColumn}>
                    <Leaderboard leaderboard={leaderboard} currentParticipantId={portfolio?.participantId} />
                </div>
            </div>
        </div>
    );
};

export default ContestView;