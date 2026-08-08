const router = require('express').Router();
const ctrl = require('../controllers/expenseController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/crop/:crop_id', ctrl.getAll);
router.get('/crop/:crop_id/summary', ctrl.getSummary);
router.post('/crop/:crop_id', ctrl.create);
router.put('/:expense_id', ctrl.update);
router.delete('/:expense_id', ctrl.remove);

module.exports = router;
