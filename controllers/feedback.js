import Feedback from '../models/feedback.js';

export const votePollFeedback = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Feedback content is required.' });
        }

        await Feedback.create({ content: content.trim() });

        res.status(201).json({ success: true, message: 'Feedback submitted anonymously.' });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ success: false, error: 'Error submitting feedback.' });
    }
};