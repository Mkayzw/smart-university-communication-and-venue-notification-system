const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');

const AUTH_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  studentId: true,
  staffId: true,
  department: true,
  createdAt: true
};

const parseNonNegativeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const AUTH_USER_CACHE_TTL_MS = parseNonNegativeInt(
  process.env.AUTH_USER_CACHE_TTL_MS,
  10000
);
const AUTH_USER_CACHE_MAX_ENTRIES = Math.max(
  1,
  parseNonNegativeInt(process.env.AUTH_USER_CACHE_MAX_ENTRIES, 5000)
);

// Short-lived per-process cache for authenticated users.
// Entries can also hold an in-flight lookup promise so concurrent requests for
// the same user share a single database query instead of stampeding Prisma.
const authUserCache = new Map();

const evictOldestEntryIfNeeded = () => {
  while (authUserCache.size >= AUTH_USER_CACHE_MAX_ENTRIES) {
    const oldestKey = authUserCache.keys().next().value;
    if (oldestKey === undefined) {
      return;
    }
    authUserCache.delete(oldestKey);
  }
};

const invalidateAuthUserCache = (userId) => {
  if (userId) {
    authUserCache.delete(userId);
  }
};

const cacheResolvedUser = (userId, user) => {
  if (!user || AUTH_USER_CACHE_TTL_MS === 0) {
    authUserCache.delete(userId);
    return;
  }

  // Refresh insertion order so the Map also behaves like a tiny LRU cache.
  authUserCache.delete(userId);
  evictOldestEntryIfNeeded();
  authUserCache.set(userId, {
    user,
    expiresAt: Date.now() + AUTH_USER_CACHE_TTL_MS
  });
};

const getAuthenticatedUser = async (prisma, userId) => {
  const cached = authUserCache.get(userId);

  if (cached) {
    if (cached.user && cached.expiresAt > Date.now()) {
      // Refresh insertion order on hit.
      authUserCache.delete(userId);
      authUserCache.set(userId, cached);
      return cached.user;
    }

    if (cached.promise) {
      return cached.promise;
    }

    authUserCache.delete(userId);
  }

  evictOldestEntryIfNeeded();

  const lookupPromise = prisma.user.findUnique({
    where: { id: userId },
    select: AUTH_USER_SELECT
  })
    .then((user) => {
      cacheResolvedUser(userId, user);
      return user;
    })
    .catch((error) => {
      authUserCache.delete(userId);
      throw error;
    });

  authUserCache.set(userId, {
    promise: lookupPromise,
    expiresAt: 0
  });

  return lookupPromise;
};

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized, no token provided', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return next(new AppError('Not authorized, invalid token', 401));
    }

    const user = await getAuthenticatedUser(req.prisma, decoded.id);

    if (!user) {
      invalidateAuthUserCache(decoded.id);
      return next(new AppError('User not found', 404));
    }

    req.user = user;
    return next();
  } catch (error) {
    // Database and infrastructure errors should remain server errors rather
    // than being incorrectly reported as "invalid token" responses.
    return next(error);
  }
};

const authorize = require('./role');

module.exports = {
  protect,
  authenticate: protect,
  authorize,
  invalidateAuthUserCache
};
