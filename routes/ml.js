import express from 'express';
import { updateUserAttributes, getUserAttributes, removeUserAttributes, getFormDataForML, getFormSubmissions } from '../controllers/ml/data.js';
import { authMiddleware } from '../middleware/auth.js';
const router = express.Router();

// User attributes routes
router.patch('/users/:userId/update-attributes', updateUserAttributes);
router.get('/users/:userId/attributes', getUserAttributes);
router.delete('/users/:userId/attributes', removeUserAttributes);
router.get('/:formId/form-data', getFormDataForML);
router.get('/:formId/submissions', getFormSubmissions);


export default router;
