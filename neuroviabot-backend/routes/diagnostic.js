// ==========================================
// 🔍 Diagnostic Routes (Developer Only)
// ==========================================
// Debug and diagnostic endpoints

const express = require('express');
const router = express.Router();
const { requireDeveloper } = require('../middleware/developerAuth');

// Public diagnostic endpoint (no auth required)
router.get('/session-check', (req, res) => {
    try {
        const sessionInfo = {
            hasSession: !!req.session,
            sessionID: req.session?.id,
            hasUser: !!req.user,
            userId: req.user?.id,
            sessionUser: req.session?.user,
            passportUser: req.session?.passport?.user,
            isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
            cookies: req.cookies,
            headers: {
                cookie: req.headers.cookie ? 'Present' : 'Missing',
                authorization: req.headers.authorization ? 'Present' : 'Missing',
            }
        };
        
        res.json({
            success: true,
            message: 'Session diagnostic info',
            data: sessionInfo
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Developer-only diagnostic endpoint
router.get('/full-diagnostic', requireDeveloper, (req, res) => {
    try {
        const fullDiagnostic = {
            session: {
                ...req.session,
                cookie: req.session?.cookie
            },
            user: req.user,
            developer: req.developer,
            headers: req.headers,
            query: req.query,
            body: req.body,
            isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
        };
        
        res.json({
            success: true,
            message: 'Full diagnostic info',
            data: fullDiagnostic
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;

