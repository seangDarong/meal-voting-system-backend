// controllers/voteController.js
import db from '../models/index.js';
import { Op } from 'sequelize';
const VotePoll = db.VotePoll;
const CandidateDish = db.CandidateDish;
const Dish = db.Dish; 
const Vote = db.Vote;

// Create a new vote poll
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

        if (parsedMealDate < today) {
            return res.status(400).json({ error: 'Cannot set vote for past meal date' });
        }

        // Calculate vote date (1 day before meal date)
        const voteDate = new Date(parsedMealDate);
        voteDate.setDate(voteDate.getDate() - 1);
        if (voteDate < today) {
            return res.status(400).json({ error: 'Vote date cannot be in the past' });
        }

        // Create vote poll
        const poll = await VotePoll.create({
            mealDate: parsedMealDate,
            voteDate,
            userId: req.user.id
        });

        // Link submitted dishes to poll
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

// Get active vote poll for today
export const getActiveVotePoll = async (req, res) => {
    try {
        const now = new Date();

        // Set today's 6:00 AM
        const startTime = new Date();
        startTime.setHours(6, 0, 0, 0);

        // Set today's 4:00 PM
        const endTime = new Date();
        endTime.setHours(16, 0, 0, 0);

        // Find the poll that is active between 6 AM and 4 PM
        const poll = await VotePoll.findOne({
            where: {
                voteDate: {
                    [Op.between]: [startTime, endTime]
                }
            },
            include: [
                {
                    model: CandidateDish,
                    include: [Dish]
                }
            ]
        });

        if (!poll) {
            return res.status(404).json({ error: 'No active vote poll right now' });
        }

        return res.status(200).json({
            pollId: poll.id,
            mealDate: poll.mealDate,
            dishes: poll.CandidateDishes.map(cd => ({
                candidateDishId: cd.id,
                isSelected: cd.isSelected,
                dish: cd.Dish
            }))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error cannot get active vote poll' });
    }
};

export const getTodayVoteResult = async (req,res) => {
    try{
        
    }catch(error){
        console.error(err);
        res.status(500).json({ error: 'Internal server error cannot get vote result.' });
    }
}