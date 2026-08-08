const router = require('express').Router();
const ctrl = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getRecommendations);
router.get('/seasons', ctrl.getSeasonsCalendar);

module.exports = router;
