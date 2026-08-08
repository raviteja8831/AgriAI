const router = require('express').Router();
const ctrl = require('../controllers/harvestController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/crop/:crop_id', ctrl.get);
router.post('/crop/:crop_id', ctrl.createOrUpdate);

module.exports = router;
