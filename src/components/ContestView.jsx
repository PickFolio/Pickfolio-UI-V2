import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/useAuthFetch';
import { getPortfolio, getLeaderboard, executeTransaction } from '../services/contestService';
import { Client as StompClient } from '@stomp/stompjs';
import styles from './ContestView.module.css';
import toast from 'react-hot-toast';
import Spinner from './Spinner';

const CONTEST_WS_URL = import.meta.env.VITE_CONTEST_WS_URL;

// Helper component for the portfolio view
const PortfolioView = ({ portfolio }) => {
    const formatCurrency = (value) => {
        if (value === null || typeof value === 'undefined') return '---';
        return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getPLColor = (value) => {
        if (value === null || typeof value === 'undefined') return 'text-gray-400';
        return value >= 0 ? 'text-green-400' : 'text-red-400';
    };

    const holdings = portfolio?.holdings || [];

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
                            <th>P/L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(portfolio?.holdings || []).length === 0 && (
                            <tr><td colSpan="4">You have no holdings.</td></tr>
                        )}
                        {(portfolio?.holdings || []).map(h => (
                            <tr key={h.id}>
                                <td>{h.stockSymbol}</td>
                                <td>{h.quantity}</td>
                                <td>{formatCurrency(h.averageBuyPrice)}</td>
                                <td className={getPLColor(h.profit)}>{formatCurrency(h.profit)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Helper component for the leaderboard
const Leaderboard = ({ leaderboard, currentParticipantId }) => (
    <div className={styles.widget}>
        <h2 className={styles.widgetTitle}>Leaderboard</h2>
        <ol className={styles.leaderboardList}>
            {leaderboard.map((player, index) => (
                <li key={player.participantId} className={player.participantId === currentParticipantId ? styles.leaderboardItemYou : styles.leaderboardItem}>
                    <div className={styles.leaderboardRank}>
                        <span>{index + 1}</span>
                        <span className={styles.leaderboardName}>{player.participantId === currentParticipantId ? "You" : player.username}</span>
                    </div>
                    <span className={styles.leaderboardValue}>₹{Number(player.totalPortfolioValue).toLocaleString('en-IN')}</span>
                </li>
            ))}
        </ol>
    </div>
);

// Helper component for the trade widget
const TradeWidget = ({ contestId, onTransactionSuccess }) => {
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [tradeType, setTradeType] = useState('BUY');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Hardcoded list of popular NIFTY 50 stocks for the dropdown
    const popularStocks = [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK', 'ITC', 'SBIN', 'BAJFINANCE', 'BHARTIARTL',
        'KOTAKBANK', 'HCLTECH', 'ASIANPAINT', 'MARUTI', 'AXISBANK', 'LT', 'BAJAJFINSV', 'WIPRO', 'ULTRACEMCO', 'NESTLEIND'
    ];
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const filteredStocks = popularStocks.filter(stock => stock.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSymbolSelect = (selectedSymbol) => {
        setSymbol(selectedSymbol);
        setSearchTerm(selectedSymbol);
        setShowDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const promise = executeTransaction(authFetch, contestId, {
            stockSymbol: symbol.toUpperCase() + '.NS',
            transactionType: tradeType,
            quantity: parseInt(quantity, 10),
        });

        await toast.promise(promise, {
            loading: 'Processing transaction...',
            success: () => {
                setSymbol('');
                setSearchTerm('');
                setQuantity('1');
                onTransactionSuccess(); // Refresh data
                return <b>Transaction successful!</b>;
            },
            error: (err) => <b>{err.message || 'Transaction failed.'}</b>,
        });
    };

    return (
        <div className={styles.widget}>
            <h2 className={styles.widgetTitle}>Place a Trade</h2>
            {error && <div className={styles.errorBox}>{error}</div>}
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.tradeGrid}>
                    {/* --- JSX for the searchable dropdown --- */}
                    <div className={styles.dropdownContainer}>
                        <label htmlFor="symbol" className={styles.inputLabel}>Stock Symbol</label>
                        <input
                            type="text"
                            id="symbol"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setSymbol(e.target.value); setShowDropdown(true); }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay allows for click
                            required
                            className={styles.input}
                            placeholder="e.g., RELIANCE"
                            autoComplete="off"
                        />
                        {showDropdown && filteredStocks.length > 0 && (
                            <ul className={styles.dropdownList}>
                                {filteredStocks.map(stock => (
                                    <li
                                        key={stock}
                                        onClick={() => handleSymbolSelect(stock)}
                                        className={styles.dropdownItem}
                                    >
                                        {stock}
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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const authFetch = useAuthFetch();
    const { tokens } = useAuth();

    const fetchInitialData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [portfolioData, leaderboardData] = await Promise.all([
                getPortfolio(authFetch, contestId),
                getLeaderboard(authFetch, contestId)
            ]);
            setPortfolio(portfolioData);
            setLeaderboard(leaderboardData || []);
        } catch (err) {
            setError(err.message || "Failed to load contest data.");
        } finally {
            setIsLoading(false);
        }
    }, [contestId, authFetch]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // Effect for the live WebSocket connection
    useEffect(() => {
        if (!tokens?.accessToken || !contestId) return;

        const stompClient = new StompClient({
            brokerURL: CONTEST_WS_URL,
            connectHeaders: {
                Authorization: `Bearer ${tokens.accessToken}`
            },
            reconnectDelay: 5000,
        });

        stompClient.onConnect = () => {
            console.log('Connected to WebSocket!');
            stompClient.subscribe(`/topic/contest/${contestId}`, (message) => {
                const update = JSON.parse(message.body);
                // Update the leaderboard with the new value
                setLeaderboard(prev =>
                    prev.map(p =>
                        p.participantId === update.participantId
                        ? { ...p, totalPortfolioValue: update.totalPortfolioValue }
                        : p
                    ).sort((a, b) => b.totalPortfolioValue - a.totalPortfolioValue)
                );
            });
        };

        stompClient.activate();

        // Cleanup function to close the connection when the component unmounts
        return () => {
            stompClient.deactivate();
        };
    }, [contestId, tokens]);

    if (isLoading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <Spinner />
        </div>
    );
    if (error) return <p className={styles.error}>Error: {error}</p>;

    return (
        <div className={styles.container}>
             <header className={styles.header}>
                <button onClick={() => navigate('/')} className={styles.backButton}>&larr; Back to Lobby</button>
                <h1 className={styles.title}>Contest View</h1>
             </header>
            <div className={styles.mainGrid}>
                <div className={styles.leftColumn}>
                    <PortfolioView portfolio={portfolio} />
                    <TradeWidget contestId={contestId} onTransactionSuccess={fetchInitialData} />
                </div>
                <div className={styles.rightColumn}>
                    <Leaderboard leaderboard={leaderboard} currentParticipantId={portfolio?.participantId} />
                </div>
            </div>
        </div>
    );
};

export default ContestView;