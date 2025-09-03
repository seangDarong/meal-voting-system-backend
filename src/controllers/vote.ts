import { Request, Response } from 'express';
import { Op } from 'sequelize';
import db from '@/models/index';
import { CastVoteRequest , UpdateVoteRequest } from '@/types/requests';

const VotePoll = db.VotePoll;
const CandidateDish = db.CandidateDish;
const Dish = db.Dish; 
const Vote = db.Vote;

export const castVote = async (req: CastVoteRequest, res: Response) => {
    try {
        const { dishId } = req.body;
        const userId = req.user?.id; // Make sure your auth middleware adds user to req

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // --- Check cookie to block multiple devices ---
        const todayStr = today.toDateString();
        if (req.cookies.voted_today === todayStr) {
            return res.status(403).json({ message: "You have already voted today on this device." });
        }

        // Find today's vote poll using date range
        const poll = await VotePoll.findOne({
            where: {
                voteDate: { [Op.gte]: today, [Op.lt]: tomorrow },
                status: "open",
            },
            include: [
                {
                    model: CandidateDish,
                    include: [
                        {
                            model: Dish,
                            attributes: { exclude: ["createdAt", "updatedAt"] },
                        },
                    ],
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                },
            ],
            attributes: { exclude: ["createdAt", "updatedAt"] },
        });

        if (!poll) return res.status(403).json({ message: "No poll open today." });

        const plainPoll = poll.get({ plain: true }) as any;
        

        // Check if dishId is valid
        const candidate = plainPoll.CandidateDishes.find((cd: any) => cd.dishId === dishId);
        if (!candidate) return res.status(400).json({ message: "Invalid dish for today." });

        // Ensure user hasn't voted yet
        const existing = await Vote.findOne({ where: { votePollId: poll.id, userId } });
        if (existing) {
            return res.status(403).json({ message: "You already voted." });
        }

        // // Create vote
        // const mealDate = new Date(today);
        // mealDate.setDate(mealDate.getDate() + 1);

        const vote = await Vote.create({ votePollId: poll.id, dishId, userId});

        // Lock device
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        res.cookie("voted_today", todayStr, { httpOnly: true, expires: endOfDay, sameSite: "strict" });

        return res.status(200).json({
            message: "Vote cast successfully",
            vote,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error: cannot cast vote",
        });
    }
};


export const updateVote = async (req: UpdateVoteRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { dishId } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Find today's vote poll using date range
        const poll = await VotePoll.findOne({
            where: {
                voteDate: { [Op.gte]: today, [Op.lt]: tomorrow },
                status: "open",
            },
            include: [
                {
                    model: CandidateDish,
                    include: [
                        {
                            model: Dish,
                            attributes: { exclude: ["createdAt", "updatedAt"] },
                        },
                    ],
                    attributes: { exclude: ["createdAt", "updatedAt"] },
                },
            ],
            attributes: { exclude: ["createdAt", "updatedAt"] },
        });

        if (!poll) return res.status(403).json({ message: "No poll open today." });

        const plainPoll = poll.get({ plain: true }) as any;
        
        // Check if dishId is valid
        const candidate = plainPoll.CandidateDishes.find((cd: any) => cd.dishId === dishId);
        if (!candidate) return res.status(400).json({ message: "Invalid dish for today." });

        // Find existing vote
        const vote = await Vote.findOne({ where: { votePollId: poll.id, userId } });
        if (!vote) {
            return res.status(404).json({ message: "No existing vote found to update." });
        }

    const [updated] = await Vote.update(
        { dishId: Number(dishId) },
        {
            where: {
            votePollId: poll.id,
            userId,
            },
        }
        );

        if (updated === 0) {
        return res.status(404).json({ message: "No existing vote found to update." });
        }

        // Fetch updated vote so response has latest data
        const updatedVote = await Vote.findOne({ where: { votePollId: poll.id, userId } });

        return res.status(200).json({
        message: "Vote updated successfully.",
        vote: updatedVote,
        });
        
    } catch (error) {
        console.error("updateVote error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};