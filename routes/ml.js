import express from 'express';
import { updateUserAttributes, getUserAttributes, removeUserAttributes } from '../controllers/ml/data.js';
const router = express.Router();


// User attributes routes
router.post('/users/:userId/attributes', updateUserAttributes);
router.get('/users/:userId/attributes', getUserAttributes);
router.delete('/users/:userId/attributes', removeUserAttributes);

export default router;