const router = require('express').Router();
const { myHistory } = require('../controllers/historyController');
const { authRequired } = require('../utils/authMiddleware');

router.get('/', authRequired, myHistory);

module.exports = router;