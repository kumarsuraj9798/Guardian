const router = require('express').Router();
const { myHistory, getIncidentHistory } = require('../controllers/historyController');
const { authRequired } = require('../utils/authMiddleware');

router.get('/', authRequired, myHistory);
router.get('/incidents', authRequired, getIncidentHistory);

module.exports = router;