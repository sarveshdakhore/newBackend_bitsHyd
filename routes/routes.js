import express from 'express';
import sign from './sign.js';
import home from './home.js';



const router = express.Router();
router.use('/sign', sign);
router.use('/', home);



export default router;