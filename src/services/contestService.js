const CONTEST_API_URL = import.meta.env.VITE_CONTEST_API_URL;

// Fetches all contests for the logged-in user
export const getMyContests = async (authFetch) => {
  return await authFetch(`${CONTEST_API_URL}/my-contests`);
};

// Fetches all open, public contests
export const getOpenPublicContests = async (authFetch) => {
  return await authFetch(`${CONTEST_API_URL}/open-public-contests`);
};

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
        body: JSON.stringify({ contestId }), // inviteCode is null for public contests
    });
};

export const joinContestByCode = async (authFetch, inviteCode) => {
  return await authFetch(`${CONTEST_API_URL}/join-by-code`, {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
  });
};