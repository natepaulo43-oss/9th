import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/dataController.js';

const router = Router();

router.use(verifyToken);

router.get('/items', getAllItems);
router.get('/items/:id', getItemById);
router.post('/items', createItem);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

export default router;
