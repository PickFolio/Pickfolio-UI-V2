const CONTEST_API_URL = import.meta.env.VITE_CONTEST_API_URL;

// Fetches all contests for the logged-in user
export const getMyContests = async (authFetch) => {
  return await authFetch(`${CONTEST_API_URL}/my-contests`);
};

// --- ADD THESE NEW FUNCTIONS ---

// Fetches the user's portfolio for a specific contest
export const getPortfolio = async (authFetch, contestId) => {
  return await authFetch(`${CONTEST_API_URL}/${contestId}/portfolio`);
};

// Fetches the leaderboard for a specific contest
export const getLeaderboard = async (authFetch, contestId) => {
  return await authFetch(`${CONTEST_API_URL}/${contestId}/leaderboard`);
};

// Executes a trade (buy/sell) transaction
export const executeTransaction = async (authFetch, contestId, { stockSymbol, transactionType, quantity }) => {
    return await authFetch(`${CONTEST_API_URL}/${contestId}/transactions`, {
        method: 'POST',
        body: JSON.stringify({ stockSymbol, transactionType, quantity }),
    });
};