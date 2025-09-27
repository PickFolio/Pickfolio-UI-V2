import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useAuthFetch from '../hooks/useAuthFetch';
import { getPortfolio, getLeaderboard, executeTransaction } from '../services/contestService';
import { Client as StompClient } from '@stomp/stompjs';
import styles from './ContestView.module.css';

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
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-teal-300">My Portfolio</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                     <div>
                        <p className="text-sm text-gray-400">Total Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(portfolio?.totalPortfolioValue)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-400">Holdings Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(portfolio?.totalHoldingsValue)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-400">Cash Balance</p>
                        <p className="text-2xl font-bold">{formatCurrency(portfolio?.cashBalance)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-400">Total P/L</p>
                        <p className={`text-2xl font-bold ${getPLColor(portfolio?.totalProfitLoss)}`}>{formatCurrency(portfolio?.totalProfitLoss)}</p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold mb-2">My Holdings</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Symbol</th>
                                    <th scope="col" className="px-4 py-3 text-right">Qty</th>
                                    <th scope="col" className="px-4 py-3 text-right">Avg. Buy</th>
                                    <th scope="col" className="px-4 py-3 text-right">Current Value</th>
                                    <th scope="col" className="px-4 py-3 text-right">P/L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.length === 0 && (
                                    <tr><td colSpan="5" className="text-center py-4 text-gray-500">You have no holdings.</td></tr>
                                )}
                                {holdings.map(h => (
                                    <tr key={h.id} className="border-b border-gray-700">
                                        <th scope="row" className="px-4 py-4 font-medium whitespace-nowrap">{h.stockSymbol}</th>
                                        <td className="px-4 py-4 text-right">{h.quantity}</td>
                                        <td className="px-4 py-4 text-right">{formatCurrency(h.averageBuyPrice)}</td>
                                        <td className="px-4 py-4 text-right">{formatCurrency(h.currentValue)}</td>
                                        <td className={`px-4 py-4 text-right font-semibold ${getPLColor(h.profit)}`}>{formatCurrency(h.profit)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
};

// Helper component for the leaderboard
const Leaderboard = ({ leaderboard, currentParticipantId }) => {
    return (
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-teal-300">Leaderboard</h2>
                <ol className="space-y-3">
                    {leaderboard.map((player, index) => (
                        <li key={player.participantId} className={`flex justify-between items-center p-3 rounded-lg ${player.participantId === currentParticipantId ? 'bg-teal-900/50 ring-2 ring-teal-500' : 'bg-gray-700'}`}>
                            <div className="flex items-center">
                                <span className="text-lg font-bold w-8">{index + 1}</span>
                                <span className="font-semibold">{player.participantId === currentParticipantId ? "You" : `${player.username.substring(0, 16)}`}</span>
                            </div>
                            <span className="font-bold text-lg">₹{Number(player.totalPortfolioValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </li>
                    ))}
                </ol>
            </div>
        );
};

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
        setIsLoading(true);
        setError(null);
        try {
            const { error: apiError } = await authFetch(`${CONTEST_API_URL}/${contestId}/transactions`, {
                method: 'POST',
                body: JSON.stringify({
                    stockSymbol: symbol.toUpperCase() + '.NS',
                    transactionType: tradeType,
                    quantity: parseInt(quantity, 10),
                })
            });
            if (apiError) throw new Error(apiError);

            alert(`Successfully ${tradeType === 'BUY' ? 'bought' : 'sold'} ${quantity} share(s) of ${symbol.toUpperCase()}.`);
            setSymbol('');
            setSearchTerm('');
            setQuantity('1');
            onTransactionSuccess();
        } catch(err) {
            setError(err.message || 'Transaction failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
         <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-teal-300">Place a Trade</h2>
             {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <label htmlFor="symbol" className="block text-sm font-medium text-gray-400 mb-1">Stock Symbol</label>
                        <input
                            type="text"
                            id="symbol"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setSymbol(e.target.value); setShowDropdown(true); }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // Delay to allow click
                            required
                            className="w-full bg-gray-700 text-white border-gray-600 rounded-lg p-3"
                            placeholder="e.g., RELIANCE"
                            autoComplete="off"
                        />
                        {showDropdown && filteredStocks.length > 0 && (
                            <ul className="absolute z-10 w-full bg-gray-600 border border-gray-500 rounded-lg mt-1 max-h-48 overflow-y-auto">
                                {filteredStocks.map(stock => (
                                    <li
                                        key={stock}
                                        onClick={() => handleSymbolSelect(stock)}
                                        className="px-3 py-2 text-white hover:bg-indigo-500 cursor-pointer"
                                    >
                                        {stock}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                     <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-400 mb-1">Quantity</label>
                        <input type="number" id="quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required min="1" className="w-full bg-gray-700 text-white border-gray-600 rounded-lg p-3" />
                    </div>
                    <div className="flex items-end">
                        <button type="submit" disabled={isLoading || !symbol} className={`w-full font-bold py-3 px-4 rounded-lg transition duration-300 ${tradeType === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:bg-gray-500`}>
                            {isLoading ? 'Processing...' : `Execute ${tradeType}`}
                        </button>
                    </div>
                </div>
                <div className="flex justify-center space-x-4 pt-2">
                     <button type="button" onClick={() => setTradeType('BUY')} className={`px-6 py-2 rounded-full text-sm font-semibold ${tradeType === 'BUY' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>BUY</button>
                     <button type="button" onClick={() => setTradeType('SELL')} className={`px-6 py-2 rounded-full text-sm font-semibold ${tradeType === 'SELL' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}>SELL</button>
                </div>
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

    if (isLoading) return <p>Loading Contest...</p>;
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