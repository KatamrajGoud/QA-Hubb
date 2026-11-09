import session from 'express-session';
import createMemoryStore from 'memorystore';

const MemoryStore = createMemoryStore(session);

export const sessionMiddleware = session({
  store: new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret-please-set-env',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
  name: 'qahub.sid',
});
