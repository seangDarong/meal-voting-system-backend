// controllers/voteController.js
import Category from "../models/category.js";
import db from "../models/index.js";
import { Op } from "sequelize";
const VotePoll = db.VotePoll;
const CandidateDish = db.CandidateDish;
const Dish = db.Dish;
const Vote = db.Vote;

// Create a new vote poll
export const submitVoteOptions = async (req, res) => {
  try {
    const { mealDate, dishIds } = req.body;

    if (!mealDate || !Array.isArray(dishIds) || dishIds.length === 0) {
      return res
        .status(400)
        .json({ error: "mealDate and dishIds are required" });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Validate and parse meal date
    const parsedMealDate = new Date(mealDate);
    if (isNaN(parsedMealDate)) {
      return res
        .status(400)
        .json({ error: "Invalid mealDate format (YYYY-MM-DD expected)" });
    }
    // Set time to midnight
    parsedMealDate.setHours(0, 0, 0, 0);

    // Calculate vote date (1 day before meal date)
    const voteDate = new Date(parsedMealDate);
    voteDate.setDate(voteDate.getDate() - 1);
    voteDate.setHours(0, 0, 0, 0); // Set time to midnight

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedMealDate < today) {
      return res
        .status(400)
        .json({ error: "Cannot set vote for past meal date" });
    }

    // Check if a poll already exists for this mealDate
    const existingPoll = await VotePoll.findOne({
      where: { mealDate: parsedMealDate },
    });
    if (existingPoll) {
      return res
        .status(409)
        .json({ error: "A vote poll for this meal date already exists" });
    }

    // Create vote poll
    const poll = await VotePoll.create({
      mealDate: parsedMealDate,
      voteDate,
      userId: req.user.id,
    });

    // Link submitted dishes to poll
    const candidates = dishIds.map((dishId) => ({
      votePollId: poll.id,
      dishId,
      isSelected: false,
    }));
    await CandidateDish.bulkCreate(candidates);

    return res.status(201).json({
      message: "Vote poll created successfully",
      pollId: poll.id,
    });
  } catch (error) {
    console.error("Error creating vote poll:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getActiveVotePoll = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const poll = await VotePoll.findOne({
      where: {
        voteDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
        status: "open",
      },
      include: [
        {
          model: CandidateDish,
          include: [Dish],
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
      ],
      attributes: { exclude: ["createdAt", "updatedAt"] },
    });

    if (!poll) {
      return res.status(404).json({ message: "No open poll for today." });
    }

    res.json({
      pollId: poll.id,
      mealDate: poll.mealDate,
      voteDate: poll.voteDate,
      dishes: poll.CandidateDishes.map((cd) => ({
        candidateDishId: cd.id,
        isSelected: cd.isSelected,
        dish: cd.Dish,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getTodayVoteResult = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find today's poll (open or closed)
    const poll = await VotePoll.findOne({
      where: {
        voteDate: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
        status: { [Op.in]: ["open", "close"] },
      },
      include: [
        {
          model: CandidateDish,
          include: [Dish],
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
      ],
      attributes: { exclude: ["createdAt", "updatedAt"] },
    });

    if (!poll) {
      return res.status(404).json({ message: "No poll for today." });
    }

    // Count votes for each dish by dishId and votePollId
    const dishesWithVotes = await Promise.all(
      poll.CandidateDishes.map(async (cd) => {
        const voteCount = await Vote.count({
          where: {
            dishId: cd.dishId,
            votePollId: poll.id,
          },
        });
        return {
          candidateDishId: cd.id,
          dishId: cd.dishId,
          dish: cd.Dish,
          voteCount,
        };
      })
    );

    res.json({
      votePollId: poll.id,
      mealDate: poll.mealDate,
      voteDate: poll.voteDate,
      voteStatus: poll.status,
      dishes: dishesWithVotes,
    });
  } catch (error) {
    console.error("Error in getTodayVoteResult:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const finalizedVotePoll = async (req, res) => {
  try {
    const pollId = req.params.id;
    const { selectedDishIds } = req.body;

    // Find poll and include candidate dishes
    const poll = await VotePoll.findByPk(pollId, {
      include: [{ model: CandidateDish }],
    });

    if (!poll) {
      return res.status(404).json({
        message: "Poll not found.",
      });
    }

    if (poll.status !== "close") {
      return res.status(400).json({
        message: "Only closed votePoll can be finalized.",
      });
    }

    // Validate selected dishes
    const candidateDishIds = poll.CandidateDishes.map((cd) => cd.dishId);
    const invalidDishes = selectedDishIds.filter(
      (id) => !candidateDishIds.includes(id)
    );
    if (invalidDishes.length > 0) {
      return res.status(400).json({
        message: "Some selected dishes are not candidates for this poll.",
        invalidDishes,
      });
    }

    // Update isSelected for finalized dishes
    await Promise.all(
      poll.CandidateDishes.map(async (cd) => {
        cd.isSelected = selectedDishIds.includes(cd.dishId);
        await cd.save();
      })
    );

    poll.status = 'finalized';
    await poll.save();
    return res.json({
      message: "Poll finalized successfully.",
      finalizedDishes: selectedDishIds,
    });
  } catch (error) {
    console.error("Error in finalizedVotePoll:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
