const router = require('express').Router();
const { report } = require('../controllers/reportController');
const { authRequired } = require('../utils/authMiddleware');

router.post('/', authRequired, report);

module.exports = router;