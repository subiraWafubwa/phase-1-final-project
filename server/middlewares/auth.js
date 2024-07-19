require('dotenv').config();
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

const auth = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({ message: 'No auth token, Access Denied' });
        }

        try {
            const verified = jwt.verify(token, secretKey);

            req.user = verified.id;
            req.token = token;

            next();
        } catch (err) {
            console.error('JWT Verification Error:', err);
            return res.status(401).json({ message: 'Token verification failed, authorization denied' });
        }
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = auth;
