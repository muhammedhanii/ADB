const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 60;
const CLEANUP_THRESHOLD = 1_000;

const requestLog = new Map();

const cleanupExpiredEntries = (now, windowMs) => {
  for (const [key, entry] of requestLog.entries()) {
    if (now - entry.startTime > windowMs) {
      requestLog.delete(key);
    }
  }
};

const getClientKey = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "local";
};

const getWindowMs = () =>
  Number(process.env.RATE_LIMIT_WINDOW_MS) || DEFAULT_WINDOW_MS;

const rateLimit = (req, res, next) => {
  const windowMs = getWindowMs();
  const maxRequests = Number(process.env.RATE_LIMIT_MAX) || DEFAULT_MAX_REQUESTS;
  const now = Date.now();
  const key = getClientKey(req);

  const entry = requestLog.get(key);
  if (!entry || now - entry.startTime > windowMs) {
    requestLog.set(key, { startTime: now, count: 1 });
    return next();
  }

  if (entry.count >= maxRequests) {
    return res.status(429).json({ message: "Too many requests." });
  }

  entry.count += 1;
  requestLog.set(key, entry);

  if (requestLog.size > CLEANUP_THRESHOLD) {
    cleanupExpiredEntries(now, windowMs);
  }

  return next();
};

setInterval(() => {
  const windowMs = getWindowMs();
  cleanupExpiredEntries(Date.now(), windowMs);
}, getWindowMs()).unref();

module.exports = rateLimit;
