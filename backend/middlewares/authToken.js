import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = 'your-access-token-secret';
const REFRESH_TOKEN_SECRET = 'your-refresh-token-secret';
const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Access token is missing' });
  
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
      console.log(err);
      if (err) return res.status(403).json({ message: 'Invalid access token' });
      req.user = user;
      next();
    });
  };

  export default authenticateToken;