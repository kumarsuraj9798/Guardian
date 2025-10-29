const router = require('express').Router();
const { upsertUnit, listMyUnits, toggleUnitActive } = require('../controllers/adminController');
const { authRequired } = require('../utils/authMiddleware');

router.get('/units', authRequired, listMyUnits);
router.post('/units', authRequired, upsertUnit);
router.post('/units/toggle', authRequired, toggleUnitActive);

module.exports = router;