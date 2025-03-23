import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../DB/dbConfig.js';

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Authorization Header:', authHeader);

  if (!authHeader) {
    console.log('No authorization header provided.');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token from the header
  console.log('Token:', token);

  if (!token) {
    console.log('No token provided.');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Decoded Token:', decoded);
    req.payload = decoded;
    
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
    });
    console.log('User:', user);

    if (!user) {
      console.log('Invalid token: User not found.');
      return res.status(400).json({ message: 'Invalid token.' });
    } else {
      req.payload.userAccount = user;
    }

    const currentTime = Math.floor(Date.now() / 1000); // Convert current time to Unix timestamp
    console.log('Current Time:', currentTime);
    console.log('Token Expiration Time:', decoded.exp);

    if (decoded.exp <= currentTime) {
      console.log('Token has expired.');
      return res.status(400).json({ message: 'Token has expired.' });
    }

    console.log('Token Version:', decoded.version);
    console.log('User Token Version:', user.token_v);

    if (decoded.version != user.token_v) {
      console.log('Invalid token version.');
      return res.status(400).json({ message: 'Invalid token version.' });
    }

    next();
  } catch (error) {
    console.log('Invalid token:', error);
    res.status(400).json({ message: 'Invalid token.' });
  }
};