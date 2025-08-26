import Category from "../models/category.js";
import db from "../models/index.js";
import { Op } from "sequelize";
const VotePoll = db.VotePoll;
const CandidateDish = db.CandidateDish;
const Dish = db.Dish;
const Vote = db.Vote;

export const castVote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dishId } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- Check cookie to block multiple devices ---
    const todayStr = today.toDateString();
    if (req.cookies.voted_today === todayStr) {
      return res.status(403).json({ message: "You have already voted today on this device." });
    }

    // Find poll
    const poll = await VotePoll.findOne({
      where: { voteDate: today, status: "open" },
      include: [{ model: CandidateDish }],
    });
    if (!poll) return res.status(403).json({ message: "No poll open today." });

    // Validate dish
    const candidate = poll.CandidateDishes.find((cd) => cd.dishId === dishId);
    if (!candidate) return res.status(400).json({ message: "Invalid dish for today." });

    // Ensure user hasn't voted
    const existing = await Vote.findOne({ where: { votePollId: poll.id, userId } });
    if (existing) {
      return res.status(403).json({ message: "You already voted. Use PUT to change your vote." });
    }

    // Create vote
    const mealDate = new Date(today);
    mealDate.setDate(mealDate.getDate() + 1);
    const vote = await Vote.create({ votePollId: poll.id, dishId, userId, mealDate });

    // Lock device
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    res.cookie("voted_today", todayStr, { httpOnly: true, expires: endOfDay, sameSite: "strict" });

    res.status(200).json({ message: "Vote cast successfully.", vote });
  } catch (err) {
    console.error("castVote error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateVote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { dishId } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's open poll
    const poll = await VotePoll.findOne({
      where: { voteDate: today, status: "open" },
      include: [{ model: CandidateDish }],
    });

    if (!poll) {
      return res.status(403).json({ message: "Voting is closed or no poll available today." });
    }

    // Validate dish
    const candidate = poll.CandidateDishes.find((cd) => cd.dishId === dishId);
    if (!candidate) {
      return res.status(400).json({ message: "Dish is not available for today's vote." });
    }

    // Find existing vote
    const vote = await Vote.findOne({ where: { votePollId: poll.id, userId } });
    if (!vote) {
      return res.status(404).json({ message: "No existing vote found to update." });
    }

    // Update vote
    vote.dishId = dishId;
    await vote.save();

    res.status(200).json({ message: "Vote updated successfully.", vote });
  } catch (err) {
    console.error("updateVote error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
