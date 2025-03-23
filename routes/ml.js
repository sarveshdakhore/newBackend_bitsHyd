import express from 'express';
import { updateUserAttributes, getUserAttributes, removeUserAttributes, getFormDataForML, getFormSubmissions, getAllFormFields,getCurrentUserProfile } from '../controllers/ml/data.js';
import { authMiddleware } from '../middleware/auth.js';
import { getMLResponse } from '../controllers/ml/connecting.js';
const router = express.Router();

// User attributes routes
router.patch('/users/:userId/update-attributes', updateUserAttributes);
router.get('/users/:userId/attributes', getUserAttributes);
router.delete('/users/:userId/attributes', removeUserAttributes);
router.get('/:formId/form-data', getFormDataForML);
router.get('/:formId/submissions', getFormSubmissions);
router.get("/form-fields", getAllFormFields);


router.get("/profile/:userId", getCurrentUserProfile);


router.post('/query', authMiddleware,getMLResponse);


export default router;
