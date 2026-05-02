const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 60;

const requestLog = new Map();

const rateLimit = (req, res, next) => {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || DEFAULT_WINDOW_MS;
  const maxRequests = Number(process.env.RATE_LIMIT_MAX) || DEFAULT_MAX_REQUESTS;
  const now = Date.now();
  const key = req.ip || req.connection?.remoteAddress || "unknown";

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
  return next();
};

module.exports = rateLimit;
