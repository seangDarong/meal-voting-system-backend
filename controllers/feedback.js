import Feedback from '../models/feedback.js';

export const createFeedback = async (req, res) => {
    try {
        // Check if cookie exists
        if (req.cookies.lastFeedback) {
            const lastFeedbackTime = new Date(req.cookies.lastFeedback);
            const now = new Date();

            const diffMinutes = Math.floor((now - lastFeedbackTime) / (1000 * 60));
            if (diffMinutes < 5) {
                return res.status(429).json({
                    success: false,
                    error: `Please wait ${5 - diffMinutes} more minute(s) before submitting again.`
                });
            }
        }

        const { canteen, system, content } = req.body;

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

        // Set/update cookie (expires in 5 minutes)
        res.cookie("lastFeedback", new Date().toISOString(), {
            httpOnly: true,
            maxAge: 5 * 60 * 1000
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

        // Fetch feedback with pagination + ordering, only feedback not connected to any dish
        const { count: total, rows } = await Feedback.findAndCountAll({
            where: { dishId: null },
            attributes: ["id", "canteen", "system", "content", "createdAt"],
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

export const createFeedbackForDish = async (req, res) => {
    try {
        const { dishId } = req.params;
        const { food, content } = req.body;

        // Prevent spamming with cookie check
        if (req.cookies.feedbackSubmitted) {
            return res.status(429).json({
                success: false,
                error: "You have already submitted feedback recently. Please wait before submitting again."
            });
        }

        // Validate dishId
        if (!dishId || isNaN(parseInt(dishId))) {
            return res.status(400).json({ success: false, error: 'Valid dishId is required.' });
        }

        // Check at least one field is provided
        const hasFood = typeof food === 'number' && food >= 1 && food <= 5;
        const hasContent = typeof content === 'string' && content.trim().length > 0;

        if (!hasFood && !hasContent) {
            return res.status(400).json({ success: false, error: 'You must provide either a food rating (1-5) or content.' });
        }

        // Save feedback
        await Feedback.create({
            dishId: parseInt(dishId),
            food: hasFood ? food : null,
            content: hasContent ? content.trim() : null
        });

        // Set a cookie that lasts for 5 minutes (300000 ms)
        res.cookie("feedbackSubmitted", "true", {
            maxAge: 300000, // 5 minutes
            httpOnly: true, // client JS cannot read it
            sameSite: "strict"
        });

        res.status(201).json({ success: true, message: 'Feedback for dish submitted.' });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ success: false, error: 'Error submitting dish feedback.' });
    }
};


export const getAllDishFeedback = async (req, res) => {
    try {
        const { dishId } = req.params;

        if (!dishId || isNaN(parseInt(dishId))) {
            return res.status(400).json({ success: false, error: 'Valid dishId is required.' });
        }

        // Get all feedback for this dish
        const feedbacks = await Feedback.findAll({
            where: { dishId: parseInt(dishId) },
            attributes: ['id', 'food', 'content', 'createdAt']
        });

        // Calculate average rating
        const ratings = feedbacks.map(fb => fb.food).filter(r => typeof r === 'number');
        const count = ratings.length;
        const average = count > 0 ? (ratings.reduce((a, b) => a + b, 0) / count).toFixed(2) : null;

        res.status(200).json({
            success: true,
            dishId: parseInt(dishId),
            averageFoodRating: average,
            totalRatings: count,
            feedbacks
        });
    } catch (error) {
        console.error('Get all dish feedback error:', error);
        res.status(500).json({ success: false, error: 'Error fetching dish feedback.' });
    }
};