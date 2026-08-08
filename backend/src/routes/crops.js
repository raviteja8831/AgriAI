const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/cropController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.get('/:id/summary', ctrl.getSummary);
router.post('/', [
  body('farm_id').isInt(),
  body('crop_name').trim().notEmpty(),
], ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
