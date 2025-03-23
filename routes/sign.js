import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {logout_user,check_jwt, hero_login, hero_register, verify_page, reg_verify ,hero_forget, reset_pass, login_otp_verify, update_pass} from '../controllers/sign.js';

const router = express.Router();



router.get('/auth', (req, res) => {
  res.render('auth.njk');
});
router.get('/reset_pass_page/:token', (req, res) => {
  res.render('reset-pass.njk');
});
router.get('/verify/:token/:email', (req, res) => {
  res.render('verify.njk');
});
router.post('/refresh',authMiddleware,check_jwt);
router.post('/login', hero_login);
router.post('/login_otp', login_otp_verify);

router.post('/register', hero_register); // in return of this request, a verification email will be sent to the user
router.get('/verify/:token', verify_page); // this route will be called when the user clicks the verification link in the email
router.post('/reg_v', reg_verify); // when clicked, the verification link will send a POST request to this route AND USER WILL BE REGISTERED

router.post('/forget_password', hero_forget);
router.post('/reset_pass', reset_pass);

router.post('/logout',authMiddleware, logout_user);
router.post('/update_password',authMiddleware, update_pass);
export default router;