const jwt = require("jsonwebtoken");
const express = require('express');
const router = express.Router();
const refreshTokensStorage = require('./refreshTokens');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();


// for secrets
require('dotenv').config()
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, tokenPayload) => {
            if(error) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            // payload={username, role}
            req.tokenPayload = tokenPayload;
            
            // pass control
            next();
        })
    } else {
        res.sendStatus(401).json({ message: "Send a valid auth token." });
    }
}

// route: /auth/token
// desc: Generate a new access token based on the refresh token
router.post('/token', jsonParser, (req, res) => {
    const { token } = req.body;

    if(!token) {
        return res.status(401).json({ message: 'Send a valid refresh token.' });
    }
    

    if (!refreshTokensStorage.refreshTokens.includes(token)) {
        return res.status(403).json({ message: 'Forbidden.' });
    }

    // check refreshToken validity (user gets it on login)
    jwt.verify(token, refreshTokenSecret, (error, user) => {
        if(error) {
            return res.status(403).json({ message: 'Forbidden.' });
        }

        // generate a new access token
        const accessToken = jwt.sign({ username: user.username, role: user.role }, accessTokenSecret, { expiresIn: '20m' });
    
        res.json({
            accessToken
        });
    
    });
})

module.exports = { router, authenticateJWT };