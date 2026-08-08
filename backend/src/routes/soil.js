const router = require('express').Router();
const ctrl = require('../controllers/soilController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/farm/:farm_id', ctrl.getAll);
router.get('/farm/:farm_id/latest', ctrl.getLatest);
router.post('/farm/:farm_id', ctrl.create);

module.exports = router;
