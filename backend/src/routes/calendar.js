const router = require('express').Router();
const ctrl = require('../controllers/calendarController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/upcoming', ctrl.getUpcoming);
router.get('/crop/:crop_id', ctrl.getForCrop);
router.post('/crop/:crop_id/generate', ctrl.generateForCrop);
router.post('/crop/:crop_id/task', ctrl.addTask);
router.put('/task/:task_id', ctrl.updateTask);

module.exports = router;
