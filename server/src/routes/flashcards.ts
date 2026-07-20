import { Router } from 'express';
import { FlashcardModel } from '../models/Flashcard';

const router = Router();

// PATCH toggle favorite status
router.patch('/:id/favorite', async (req, res) => {
  const { id } = req.params;
  const userId = 'user_123'; // Dummy user for now
  try {
    const flashcard = await FlashcardModel.findOne({ _id: id, userId });
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    if (process.env.SKIP_MONGO !== 'true') {
      flashcard.isFavorited = !flashcard.isFavorited;
      await flashcard.save();
    }

    res.json({ success: true, isFavorited: !flashcard.isFavorited });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update flashcard' });
  }
});

// DELETE a flashcard
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const userId = 'user_123';
  try {
    if (process.env.SKIP_MONGO === 'true') {
      return res.json({ success: true });
    }

    const doc = await FlashcardModel.findOneAndDelete({ _id: id, userId });
    if (!doc) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete flashcard' });
  }
});

export default router;
