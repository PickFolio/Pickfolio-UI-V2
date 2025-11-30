const CONTEST_API_URL = import.meta.env.VITE_CONTEST_API_URL;

// Fetches all contests for the logged-in user
export const getMyContests = async (authFetch) => {
  return await authFetch(`${CONTEST_API_URL}/my-contests`);
};

// Fetches all open, public contests
export const getOpenPublicContests = async (authFetch) => {
  return await authFetch(`${CONTEST_API_URL}/open-public-contests`);
};

// Fetch single contest details (for status check) ---
export const getContestDetails = async (authFetch, contestId) => {
    return await authFetch(`${CONTEST_API_URL}/details/${contestId}`);
};

export const getPortfolio = async (authFetch, contestId) => {
  return await authFetch(`${CONTEST_API_URL}/${contestId}/portfolio`);
};

// Fetches the leaderboard for a specific contest
export const getLeaderboard = async (authFetch, contestId) => {
  return await authFetch(`${CONTEST_API_URL}/${contestId}/leaderboard`);
};

export const getStockQuote = async (authFetch, symbol) => {
    return await authFetch(`${CONTEST_API_URL}/quote/${symbol}`);
};

export const executeTransaction = async (authFetch, contestId, { stockSymbol, transactionType, quantity }) => {
    return await authFetch(`${CONTEST_API_URL}/${contestId}/transactions`, {
        method: 'POST',
        body: JSON.stringify({ stockSymbol, transactionType, quantity }),
    });
};

export const createContest = async (authFetch, contestData) => {
  return await authFetch(`${CONTEST_API_URL}/create`, {
      method: 'POST',
      body: JSON.stringify(contestData),
  });
};

// Join a public contest by ID
export const joinContest = async (authFetch, contestId) => {
    return await authFetch(`${CONTEST_API_URL}/join`, {
        method: 'POST',
        body: JSON.stringify({ contestId }),
    });
};

export const joinContestByCode = async (authFetch, inviteCode) => {
  return await authFetch(`${CONTEST_API_URL}/join-by-code`, {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
  });
};

export const searchStocks = async (authFetch, query) => {
    return await authFetch(`${CONTEST_API_URL}/search?q=${encodeURIComponent(query)}`);
};