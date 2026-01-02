import { Router } from 'express';
import { signup, signin, signout } from '#controllers/auth.controller.js';

const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/signout', signout);

router.post('/refresh', (req, res) => {
  res.status(200).json({ message: 'Refresh route' });
});

export default router;
