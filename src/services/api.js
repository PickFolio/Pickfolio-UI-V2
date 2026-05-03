const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || "/api/auth";
const CONTEST_API_URL = import.meta.env.VITE_CONTEST_API_URL || "/api/contests";
const MARKET_DATA_API_URL = import.meta.env.VITE_MARKET_DATA_API_URL || "/api/market-data";

/**
 * @typedef {{ accessToken: string, refreshToken: string }} LoginResponse
 * @typedef {{ name: string, isPrivate: boolean, startTime: string, endTime: string, virtualBudget: number, maxParticipants: number }} CreateContestRequest
 * @typedef {{ id: string, name: string, status: "OPEN"|"LIVE"|"COMPLETED", isPrivate: boolean, inviteCode?: string, startTime: string, endTime: string, virtualBudget: number, maxParticipants: number, currentParticipants: number, creatorId: string, createdAt: string }} ContestResponse
 * @typedef {{ stockSymbol: string, transactionType: "BUY"|"SELL", quantity: number }} TransactionRequest
 * @typedef {{ symbol: string, price: number }} QuoteResponse
 * @typedef {{ symbol: string, isValid: boolean }} ValidationResponse
 * @typedef {{ symbol: string, name: string, type: string }} SearchResult
 */

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || data?.detail || "Request failed.";
    throw new Error(message);
  }

  return data;
}

export async function apiRequest(url, options = {}) {
  const { body, token, headers, ...rest } = options;
  const requestHeaders = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse(response);
}

export const endpoints = {
  auth: {
    login: `${AUTH_API_URL}/login`,
    register: `${AUTH_API_URL}/register`,
    refresh: `${AUTH_API_URL}/refresh`,
    logout: `${AUTH_API_URL}/logout`,
    logoutAll: `${AUTH_API_URL}/logout-all`,
  },
  contest: {
    create: `${CONTEST_API_URL}/create`,
    openPublic: `${CONTEST_API_URL}/open-public-contests`,
    details: (contestId) => `${CONTEST_API_URL}/details/${contestId}`,
    join: `${CONTEST_API_URL}/join`,
    joinByCode: `${CONTEST_API_URL}/join-by-code`,
    myContests: `${CONTEST_API_URL}/my-contests`,
    portfolio: (contestId) => `${CONTEST_API_URL}/${contestId}/portfolio`,
    leaderboard: (contestId) => `${CONTEST_API_URL}/${contestId}/leaderboard`,
    transactions: (contestId) => `${CONTEST_API_URL}/${contestId}/transactions`,
    quote: (symbol) => `${CONTEST_API_URL}/quote/${encodeURIComponent(symbol)}`,
    search: (query) => `${CONTEST_API_URL}/search?q=${encodeURIComponent(query)}`,
    suggestedFormat: `${CONTEST_API_URL}/suggested-format`,
  },
  marketData: {
    history: (symbol, range = "1mo", interval = "1d") =>
      `${MARKET_DATA_API_URL}/history/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}`,
    validate: (symbol) => `${MARKET_DATA_API_URL}/validate/${encodeURIComponent(symbol)}`,
    quote: (symbol) => `${MARKET_DATA_API_URL}/quote/${encodeURIComponent(symbol)}`,
    search: (query) => `${MARKET_DATA_API_URL}/search?query=${encodeURIComponent(query)}`,
    pulse: `${MARKET_DATA_API_URL}/pulse`,
  },
};
