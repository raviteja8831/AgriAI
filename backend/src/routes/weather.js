const router = require('express').Router();
const ctrl = require('../controllers/weatherController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/farm/:farm_id/current', ctrl.getCurrent);
router.get('/farm/:farm_id/forecast', ctrl.getForecast);
router.get('/farm/:farm_id/history', ctrl.getHistory);
router.post('/farm/:farm_id/record', ctrl.saveDaily);

module.exports = router;
