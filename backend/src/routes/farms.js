const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/farmController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', [
  body('name').trim().notEmpty(),
  body('area_acres').isFloat({ gt: 0 }),
], ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
