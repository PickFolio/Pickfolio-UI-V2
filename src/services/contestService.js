import { apiRequest, endpoints } from './api';

export const getMyContests = async (authFetch) => {
  return await authFetch(endpoints.contest.myContests);
};

export const getOpenPublicContests = async (authFetch) => {
  return await authFetch(endpoints.contest.openPublic);
};

export const getContestDetails = async (authFetch, contestId) => {
  return await authFetch(endpoints.contest.details(contestId));
};

export const getPortfolio = async (authFetch, contestId) => {
  return await authFetch(endpoints.contest.portfolio(contestId));
};

export const getLeaderboard = async (authFetch, contestId) => {
  return await authFetch(endpoints.contest.leaderboard(contestId));
};

export const getStockQuote = async (authFetch, symbol) => {
  return await authFetch(endpoints.contest.quote(symbol));
};

export const getStockHistory = async (authFetch, symbol, range = '1mo', interval = '1d') => {
  return await authFetch(endpoints.marketData.history(symbol, range, interval));
};

export const validateStockSymbol = async (symbol) => {
  return await apiRequest(endpoints.marketData.validate(symbol));
};

export const executeTransaction = async (authFetch, contestId, { stockSymbol, transactionType, quantity }) => {
  return await authFetch(endpoints.contest.transactions(contestId), {
    method: 'POST',
    body: JSON.stringify({ stockSymbol, transactionType, quantity }),
  });
};

export const createContest = async (authFetch, contestData) => {
  return await authFetch(endpoints.contest.create, {
    method: 'POST',
    body: JSON.stringify(contestData),
  });
};

export const joinContest = async (authFetch, contestId) => {
  return await authFetch(endpoints.contest.join, {
    method: 'POST',
    body: JSON.stringify({ contestId }),
  });
};

export const joinContestByCode = async (authFetch, inviteCode) => {
  return await authFetch(endpoints.contest.joinByCode, {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  });
};

export const searchStocks = async (authFetch, query) => {
  return await authFetch(endpoints.contest.search(query));
};
