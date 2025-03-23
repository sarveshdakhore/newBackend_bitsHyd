import express from 'express';
import sign from './sign.js';
import home from './home.js';
import ml from './ml.js';



const router = express.Router();
router.use('/sign', sign);
router.use('/', home);
router.use('/ml', ml);



export default router;