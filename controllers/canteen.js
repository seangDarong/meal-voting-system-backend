// controllers/voteController.js
import db from '../models/index.js';
const VotePoll = db.VotePoll;
const CandidateDish = db.CandidateDish;

export const submitVoteOptions = async (req, res) => {
    try {
        const { voteDate, dishIds } = req.body;

        if (!voteDate || !Array.isArray(dishIds) || dishIds.length === 0) {
            return res.status(400).json({ error: 'voteDate and dishIds are required' });
        }

        // Make sure staffId is available (from auth middleware)
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Staff ID is required (user not authenticated)' });
        }

        const staffId = req.user.id;

        // Configurable limits
        const maxDaysAhead = 30; 
        const allowedMaxDishes = 5;

        // Today's date (midnight)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Input vote date
        const voteDateObj = new Date(voteDate);
        voteDateObj.setHours(0, 0, 0, 0);

        // 1. Prevent past dates
        if (voteDateObj < today) {
            return res.status(400).json({ error: 'voteDate cannot be in the past' });
        }

        // 2. Prevent too far in the future
        const diffInDays = Math.floor((voteDateObj - today) / (1000 * 60 * 60 * 24));
        if (diffInDays > maxDaysAhead) {
            return res.status(400).json({ error: `voteDate cannot be more than ${maxDaysAhead} days ahead` });
        }

        // 3. Enforce dish limit
        if (dishIds.length > allowedMaxDishes) {
            return res.status(400).json({ error: `Cannot submit more than ${allowedMaxDishes} dishes` });
        }

        // 4. Prevent duplicate polls
        const existingPoll = await VotePoll.findOne({ where: { voteDate } });
        if (existingPoll) {
            return res.status(400).json({ error: 'A vote poll already exists for this date' });
        }

        // 5. Calculate mealDate = voteDate + 1
        const mealDateObj = new Date(voteDateObj);
        mealDateObj.setDate(mealDateObj.getDate() + 1);

        const mealDateStr = mealDateObj.toISOString().split('T')[0]; // DATEONLY format

        // 6. Create poll with staffId
        const votePoll = await VotePoll.create({
            voteDate,
            mealDate: mealDateStr,
            staffId // store which staff created it
        });

        // 7. Create candidate dishes
        const entries = dishIds.map(dishId => ({
            votePollId: votePoll.id,
            dishId,
            isSelected: false
        }));
        await CandidateDish.bulkCreate(entries);

        return res.status(201).json({
            message: 'Vote poll created successfully',
            votePollId: votePoll.id,
            voteDate,
            mealDate: mealDateStr,
            staffId
        });

    } catch (error) {
        console.error('Error creating vote poll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
