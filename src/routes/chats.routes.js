const router = require('express').Router();
const { authenticate, requireVerified } = require('../middleware/auth.middleware');
const chatRepo = require('../repositories/chat.repository');

// GET /chats — list user's chats
router.get('/', authenticate, async (req, res) => {
  try {
    const chats = await chatRepo.findByUser(req.user.id);
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: 'Error interno' });
  }
});

// GET /chats/:id — chat details + messages
router.get('/:id', authenticate, async (req, res) => {
  try {
    const hasAccess = await chatRepo.hasAccess(req.params.id, req.user.id);
    if (!hasAccess) return res.status(403).json({ message: 'Acceso denegado' });

    const [chat, messages] = await Promise.all([
      chatRepo.findById(req.params.id),
      chatRepo.getMessages(req.params.id, 50),
    ]);

    await chatRepo.markMessagesRead(req.params.id, req.user.id);
    res.json({ chat, messages });
  } catch (err) {
    res.status(500).json({ message: 'Error interno' });
  }
});

// GET /chats/:id/messages — paginated messages
router.get('/:id/messages', authenticate, async (req, res) => {
  try {
    const hasAccess = await chatRepo.hasAccess(req.params.id, req.user.id);
    if (!hasAccess) return res.status(403).json({ message: 'Acceso denegado' });

    const messages = await chatRepo.getMessages(
      req.params.id,
      parseInt(req.query.limit) || 50,
      req.query.before
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;
