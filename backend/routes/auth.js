const router = require('express').Router();
const { googleLogin, facebookLogin, instagramLogin, setRole, emailRegister, emailLogin } = require('../controllers/authController');
const { authRequired } = require('../utils/authMiddleware');

router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/instagram', instagramLogin);
router.post('/role', authRequired, setRole);
router.post('/email/register', emailRegister);
router.post('/email/login', emailLogin);
// Convenience aliases
router.post('/register', emailRegister);
router.post('/login', emailLogin);

module.exports = router;