const Message = require('../model/Messages')

exports.getMessagesBetween = async (req, res, next) => {
    const { user1, user2 } = req.params;

    try {
        const messages = await Message.find({
            $or: [
                { senderId: user1, receiverId: user2 },
                { senderId: user2, receiverId: user1 }
            ]
        }).sort({ timestamp: 1 });

        res.status(200).json({ messages })
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ message: 'Error fetching messages' });
    }
};

exports.markMessagesAsSeen = async (req, res, next) => {
    const { senderId, receiverId } = req.body;

    try {
        await Message.updateMany(
            { senderId, receiverId, seen: false },
            { $set: { seen: true } }
        );
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Error updating seen status' });
    }
};