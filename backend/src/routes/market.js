const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/marketController');
router.use(authenticate);
router.get('/', ctrl.getPrices);
router.get('/my-crops', ctrl.getForFarmer);
router.get('/veg-flower', ctrl.getVegFlowerPrices);
module.exports = router;
