import rateLimit from "express-rate-limit";

// Global limiter (applies to all requests)
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true, // return rate limit info in headers
    legacyHeaders: false, // disable X-RateLimit headers
});

// Login limiter (example for sensitive routes)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // only 100 login attempts per window
    message: { error: "Too many login attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});