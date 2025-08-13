// controllers/voteController.js
import db from '../models/index.js';
const VotePoll = db.VotePoll;
const CandidateDish = db.CandidateDish;
const Vote = db.Vote;

export const submitVoteOptions = async (req, res) => {
    try {
        const { mealDate, dishIds } = req.body; // Changed from voteDate to mealDate

        if (!mealDate || !Array.isArray(dishIds) || dishIds.length === 0) {
            return res.status(400).json({ error: 'mealDate and dishIds are required' });
        }

        // Make sure user is authenticated (for staff creating vote options)
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const createdBy = req.user.id; // Who created this vote poll

        // Configurable limits
        const maxDaysAhead = 30; 
        const allowedMaxDishes = 5;

        // Today's date (midnight)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Input meal date
        const mealDateObj = new Date(mealDate);
        mealDateObj.setHours(0, 0, 0, 0);

        // 1. Prevent past dates
        if (mealDateObj <= today) {
            return res.status(400).json({ error: 'mealDate must be in the future' });
        }

        // 2. Prevent too far in the future
        const diffInDays = Math.floor((mealDateObj - today) / (1000 * 60 * 60 * 24));
        if (diffInDays > maxDaysAhead) {
            return res.status(400).json({ error: `mealDate cannot be more than ${maxDaysAhead} days ahead` });
        }

        // 3. Enforce dish limit
        if (dishIds.length > allowedMaxDishes) {
            return res.status(400).json({ error: `Cannot submit more than ${allowedMaxDishes} dishes` });
        }

        // 4. Prevent duplicate polls
        const existingPoll = await VotePoll.findOne({ where: { mealDate } });
        if (existingPoll) {
            return res.status(400).json({ error: 'A vote poll already exists for this meal date' });
        }

        // 5. Calculate voting deadline (e.g., 1 day before meal)
        const votingDeadline = new Date(mealDateObj);
        votingDeadline.setDate(votingDeadline.getDate() - 1);
        votingDeadline.setHours(23, 59, 59, 999); // End of previous day

        // 6. Create poll with proper fields
        const votePoll = await VotePoll.create({
            title: `Meal Vote for ${mealDate}`,
            description: `Vote for your preferred dishes for ${mealDate}`,
            startDate: new Date(), // Voting starts now
            endDate: votingDeadline, // Voting ends before meal date
            mealDate: mealDate, // The actual meal date
            isActive: true,
            createdBy: createdBy // Who created this poll
        });

        // 7. Create candidate dishes
        const entries = dishIds.map(dishId => ({
            pollId: votePoll.id, // Use pollId instead of votePollId
            dishId,
            voteCount: 0 // Initialize vote count
        }));
        await CandidateDish.bulkCreate(entries);

        return res.status(201).json({
            message: 'Vote poll created successfully',
            votePollId: votePoll.id,
            mealDate: mealDate,
            votingDeadline: votingDeadline,
            createdBy: createdBy,
            candidateDishes: entries.length
        });

    } catch (error) {
        console.error('Error creating vote poll:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Add a function for voters to submit their votes
export const submitVote = async (req, res) => {
    try {
        const { pollId, dishId } = req.body;

        if (!pollId || !dishId) {
            return res.status(400).json({ error: 'pollId and dishId are required' });
        }

        // Make sure user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userId = req.user.id;

        // Check if poll exists and is active
        const poll = await VotePoll.findByPk(pollId);
        if (!poll) {
            return res.status(404).json({ error: 'Vote poll not found' });
        }

        if (!poll.isActive) {
            return res.status(400).json({ error: 'This poll is no longer active' });
        }

        // Check if voting deadline has passed
        if (new Date() > poll.endDate) {
            return res.status(400).json({ error: 'Voting deadline has passed' });
        }

        // Check if user already voted in this poll
        const existingVote = await Vote.findOne({
            where: { pollId, userId }
        });

        if (existingVote) {
            return res.status(400).json({ error: 'You have already voted in this poll' });
        }

        // Check if the dish is a candidate in this poll
        const candidateDish = await CandidateDish.findOne({
            where: { pollId, dishId }
        });

        if (!candidateDish) {
            return res.status(400).json({ error: 'This dish is not available in this poll' });
        }

        // Create the vote
        const vote = await Vote.create({
            pollId,
            userId, // This will properly save the user ID
            dishId,
            createdAt: new Date() // Vote timestamp (different from meal date)
        });

        // Update candidate dish vote count
        await candidateDish.increment('voteCount');

        return res.status(201).json({
            message: 'Vote submitted successfully',
            voteId: vote.id,
            pollId,
            dishId,
            userId,
            votedAt: vote.createdAt
        });

    } catch (error) {
        console.error('Error submitting vote:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
