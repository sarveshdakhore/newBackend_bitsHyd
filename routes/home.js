import express from 'express';
import { hero_home, data } from '../controllers/home.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index.njk');
});
router.get('/data', data);


export default router;