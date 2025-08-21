import Feedback from '../models/feedback.js';

export const createFeedback = async (req, res) => {
    try {
        const { canteen, system, content } = req.body;

        // Check if at least one field is provided
        if (
            typeof canteen !== 'number' &&
            typeof system !== 'number' &&
            (typeof content !== 'string' || content.trim().length === 0)
        ) {
            return res.status(400).json({ success: false, error: 'At least one feedback field (canteen, system, or content) is required.' });
        }

        await Feedback.create({
            canteen: typeof canteen === 'number' ? canteen : null,
            system: typeof system === 'number' ? system : null,
            content: typeof content === 'string' ? content.trim() : null
        });

        res.status(201).json({ success: true, message: 'Feedback submitted anonymously.' });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ success: false, error: 'Feedback error: Error submitting feedback.' });
    }
};

//get feedback
export const getFeedback = async (req, res) => {
    try {
        // Parse pagination params
        let { limit = 10, offset = 0 } = req.query;
        limit = parseInt(limit, 10);
        offset = parseInt(offset, 10);

        // Cap to safe limits
        if (isNaN(limit) || limit <= 0) limit = 10;
        if (limit > 50) limit = 50; // max 50 per request
        if (isNaN(offset) || offset < 0) offset = 0;

        // Fetch feedback with pagination + ordering
        const { count: total, rows } = await Feedback.findAndCountAll({
            attributes: ["id", "content", "createdAt"], // anonymous fields only
            order: [["createdAt", "DESC"]],
            limit,
            offset
        });

        // Calculate nextOffset (if more items exist)
        const nextOffset = offset + limit < total ? offset + limit : null;

        res.status(200).json({
            success: true,
            items: rows,
            total,
            nextOffset
        });
    } catch (error) {
        console.error("Feedback error:", error);
        res.status(500).json({
            success: false,
            error: "Feedback error: Error fetching feedback."
        });
    }
};
