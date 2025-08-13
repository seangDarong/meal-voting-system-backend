// controllers/voteController.js
import db from '../models/index.js';
const VotePoll = db.VotePoll;
const CandidateDish = db.CandidateDish;
const Vote = db.Vote;

export const submitVoteOptions = async (req, res) => {
    try {
        const { mealDate, dishIds } = req.body;

        if (!mealDate || !Array.isArray(dishIds) || dishIds.length === 0) {
            return res.status(400).json({ error: 'mealDate and dishIds are required' });
        }

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

         // Validate and parse meal date
        const parsedMealDate = new Date(mealDate);
        if (isNaN(parsedMealDate)) {
            return res.status(400).json({ error: 'Invalid mealDate format (YYYY-MM-DD expected)' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (parsedMealDate < today){
            return res.status(400).json({ error: 'Cannot set vote for past meal date' });
        }

        //calculate meal date 
        const voteDate = new Date(parsedMealDate);
        voteDate.setDate(voteDate.getDate() - 1);
        if (voteDate < today) {
            return res.status(400).json({ error: 'Vote date cannot be in the past'});
        }
        
        //create vote poll
        const poll = await VotePoll.create({
            mealDate: parsedMealDate,
            voteDate,
            userId: req.user.id
        })

        // Link all submitted dishes to this poll
        const candidates = dishIds.map(dishId => ({
            votePollId: poll.id,
            dishId,
            isSelected: false
        }));
        await CandidateDish.bulkCreate(candidates);

        return res.status(201).json({
            message: 'Vote poll created successfully',
            pollId: poll.id
        });

        

    } catch (error) {
        console.error('Error creating vote poll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


