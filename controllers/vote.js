import Category from "../models/category.js";
import db from "../models/index.js";
import { Op } from "sequelize";
const VotePoll = db.VotePoll;
const CandidateDish = db.CandidateDish;
const Dish = db.Dish;
const Vote = db.Vote;

export const castVote = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { dishId } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mealDate = new Date(today);
    mealDate.setDate(mealDate.getDate() + 1);

    // Find today's open poll
    const poll = await VotePoll.findOne({
      where: { voteDate: today, status: "open" },
      include: [{ model: CandidateDish }],
    });

    if (!poll) {
      return res
        .status(403)
        .json({ message: "Voting is closed or no poll available today." });
    }

    // Validate dish is among today's candidates
    const candidate = poll.CandidateDishes.find((cd) => cd.dishId === dishId);
    if (!candidate) {
      return res
        .status(400)
        .json({ message: "Dish is not available for today's vote." });
    }

    // Check if user already voted
    let vote = await Vote.findOne({
      where: { votePollId: poll.id, userId },
    });

    if (vote) {
      // Update existing vote
      vote.dishId = dishId;
      vote.mealDate = mealDate;
      await vote.save();
      return res
        .status(200)
        .json({ message: "Vote updated successfully.", vote });
    }

    // Create new vote
    vote = await Vote.create({
      votePollId: poll.id,
      dishId,
      userId,
      mealDate,
    });

    res.status(200).json({ message: "Vote cast successfully.", vote });
  } catch (error) {
    console.error("Error in castVote:", error);
    res.status(500).json({ error: "Internal server error cannot cast vote" });
  }
};
