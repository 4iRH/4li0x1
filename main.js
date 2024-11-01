const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const slowDown = require('express-slow-down');

const app = express();
const PORT = process.env.PORT || 8080;

// Enhanced security config with stricter CSP
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'none'"],
            scriptSrc: ["'self'", "https://unpkg.com", "https://static.cloudflareinsights.com", "'unsafe-inline'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
            imgSrc: ["'self'", "https:", "data:", "https://github.com", "https://avatars.githubusercontent.com", "blob:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            connectSrc: ["'self'", "https://api.github.com"],
            baseUri: ["'self'"],
            formAction: ["'self'", "https://www.google.com/search"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
            manifestSrc: ["'self'"],
            mediaSrc: ["'self'"],
            workerSrc: ["'none'"],
            frameSrc: ["'none'"],
            upgradeInsecureRequests: [],
            blockAllMixedContent: []
        }
    },
    crossOriginEmbedderPolicy: { policy: "require-corp" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hsts: { 
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
        setIf: (req) => req.secure || req.headers['x-forwarded-proto'] === 'https'
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
}));

// Enhanced CORS with iOS compatibility
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 
        [process.env.ALLOWED_ORIGIN, 'capacitor://localhost', 'ionic://localhost'] : '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    credentials: true,
    maxAge: 3600,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Enhanced rate limiting with IP filtering
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        return req.headers['cf-connecting-ip'] || 
               req.headers['x-real-ip'] || 
               req.headers['x-forwarded-for']?.split(',')[0] || 
               req.ip;
    },
    skip: (req) => {
        const trustedIPs = process.env.TRUSTED_IPS?.split(',') || [];
        return trustedIPs.includes(req.ip);
    },
    handler: (req, res) => {
        res.status(429).sendFile(path.join(__dirname, 'public', 'rate-limit.html'));
    }
});

// Enhanced speed limiter
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 30,
    delayMs: (hits) => Math.min(hits * 150, 3000),
    maxDelayMs: 3000,
    skipFailedRequests: true,
    skipSuccessfulRequests: true
});

// Enhanced security middleware
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        console.warn(`Attempted NoSQL injection detected: ${key}`);
    }
}));
app.use(xss());
app.use(hpp({
    whitelist: [] // Add any parameters that should be allowed duplicates
}));
app.use(express.json({ 
    limit: '10kb',
    strict: true,
    type: ['application/json', 'application/csp-report']
}));
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));

// Enhanced static file serving
app.use(express.static('public', {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    index: false,
    setHeaders: (res, path, stat) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        
        // iOS-specific headers
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
        if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
            res.setHeader('Accept-Ranges', 'bytes');
        }
    }
}));

app.use(limiter);
app.use(speedLimiter);

// Enhanced security headers
app.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    
    // iOS-specific headers
    res.setHeader('X-Apple-Mobile-Web-App-Capable', 'yes');
    res.setHeader('X-Apple-Mobile-Web-App-Status-Bar-Style', 'black-translucent');
    next();
});

// Enhanced MIME type handling for react.jsx
app.get('/react.jsx', (req, res) => {
    res.set({
        'Content-Type': 'application/javascript; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
    });
    res.sendFile(path.join(__dirname, 'public', 'react.jsx'));
});

// Main route with enhanced security
app.get('/', (req, res) => {
    res.set({
        'Feature-Policy': "camera 'none'; microphone 'none'; geolocation 'none'",
        'X-UA-Compatible': 'IE=edge,chrome=1'
    });
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Enhanced error handling with logging
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const errorId = Math.random().toString(36).substring(7);
    
    console.error(`[${timestamp}] Error ID: ${errorId}`, {
        error: err.stack,
        method: req.method,
        url: req.url,
        headers: req.headers,
        ip: req.ip
    });
    
    const error = process.env.NODE_ENV === 'production' ? 
        'Internal Server Error' : err.stack;
    
    res.status(500).json({
        status: 'error',
        message: error,
        errorId
    });
});

// Enhanced 404 handler
app.use((req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'public', '404.html'));
        return;
    }
    if (req.accepts('json')) {
        res.json({ error: 'Not found' });
        return;
    }
    res.type('txt').send('Not found');
});

// Enhanced server initialization
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please check your connection and make sure no other service is running on this port.`);
    } else {
        console.error('Server error:', err);
    }
    process.exit(1);
});

// Enhanced graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
    
    // Force shutdown after 25 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 25000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
