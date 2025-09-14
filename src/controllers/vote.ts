import { Request, Response } from 'express';
import { Op } from 'sequelize';
import db from '@/models/index';
import { CastVoteRequest , UpdateVoteRequest ,GetUserVoteHistoryRequest ,GetUserVoteTodayRequest} from '@/types/requests';

const VotePoll = db.VotePoll;
const CandidateDish = db.CandidateDish;
const Dish = db.Dish; 
const Vote = db.Vote;

interface DishVoteResult {
    candidateDishId: number;
    dishId: number;
    dish: string;
    voteCount: number;
}


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
        res.cookie("voted_today", todayStr, { 
            httpOnly: false, 
            expires: endOfDay, 
            sameSite: "none",
            secure: true,
        });

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

    export const getUserVoteHistory = async (req: GetUserVoteHistoryRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        // Safely extract and narrow date type
        const dateParam = req.query.date;
        const dateString = typeof dateParam === "string" ? dateParam : undefined;

        if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
        }

        // If no date provided, use today
        const inputDate = dateString ? new Date(dateString) : new Date();

        if (isNaN(inputDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
        }

        inputDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(inputDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Find poll on that date
        const poll = await VotePoll.findOne({
        where: {
            voteDate: { [Op.gte]: inputDate, [Op.lt]: nextDay },
            status: { [Op.in]: ["open", "close", "finalized"] },
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

        if (!poll) {
        return res.status(404).json({ message: "No poll found for this date." });
        }

        const plainPoll = poll.get({ plain: true }) as any;

        // Find user’s vote in this poll with Dish details
        const userVote = await Vote.findOne({
        where: { votePollId: poll.id, userId },
        include: [
            {
            model: Dish,
            attributes: { exclude: ["createdAt", "updatedAt"] },
            },
        ],
        attributes: { exclude: ["createdAt", "updatedAt"] },
        });

        // If poll is finalized, return finalized format
        if (poll.status === "finalized") {
        return res.status(200).json({
            votePollId: plainPoll.id,
            mealDate: plainPoll.mealDate,
            voteDate: plainPoll.voteDate,
            userVote: userVote ?? null,
            selectedDishes: plainPoll.CandidateDishes.filter((cd: any) => cd.isSelected),
        });
        }

        // If poll is open or close, return current vote counts
        const dishesWithVotes = await Promise.all(
        (plainPoll.CandidateDishes ?? []).map(async (cd: any) => {
            const voteCount = await Vote.count({
            where: { dishId: cd.dishId, votePollId: cd.votePollId },
            });
            return {
            candidateDishId: cd.id,
            dishId: cd.dishId,
            dish: cd.Dish?.name ?? "Unknown",
            voteCount,
            };
        })
        );

        return res.status(200).json({
        votePollId: plainPoll.id,
        mealDate: plainPoll.mealDate,
        voteDate: plainPoll.voteDate,
        userVote: userVote ?? null,
        dishes: dishesWithVotes,
        });
    } catch (error) {
        console.error("getUserVoteHistory error:", error);
        return res.status(500).json({
        message: "Internal server error cannot get user vote history",
        });
    }
    };

    export const getUserTodayVote = async (req: GetUserVoteTodayRequest, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ message: "Unauthorized" });

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            // Find today's open poll
            const poll = await VotePoll.findOne({
            where: {
                voteDate: { [Op.gte]: today, [Op.lt]: tomorrow },
                status: "open",
            },
            include: [
                {
                model: CandidateDish,
                include: [
                    { model: Dish, attributes: { exclude: ["createdAt", "updatedAt"] } }
                ],
                attributes: { exclude: ["createdAt", "updatedAt"] }
                }
            ],
            attributes: { exclude: ["createdAt", "updatedAt"] },
            });

            if (!poll) return res.status(404).json({ message: "No open poll today." });

            const plainPoll = poll.get({ plain: true }) as any;

            // Find what the user has voted for
            const userVote = await Vote.findOne({
            where: { votePollId: poll.id, userId },
            include: [{ model: Dish, attributes: ["id", "name", "name_kh"] }]
            });

            return res.status(200).json({
            votePollId: poll.id,
            voteDate: poll.voteDate,
            userVote: userVote ?? null,
            candidateDishes: plainPoll.CandidateDishes.map((cd: any) => ({
                dishId: cd.dishId,
                name: cd.Dish?.name,
                name_kh: cd.Dish?.name_kh,
            }))
            });
        } catch (error) {
            console.error("getUserTodayVote error:", error);
            return res.status(500).json({ message: "Internal server error cannot get user vote" });
        }
    };
