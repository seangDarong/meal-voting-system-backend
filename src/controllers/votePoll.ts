import { Request, Response } from 'express';
import { Op } from 'sequelize';
import db from '@/models/index';
import { VotePollAttributes, VotePollCreationAttributes } from '@/models/votePoll';
import { CandidateDishAttributes, CandidateDishCreationAttributes } from '@/models/candidateDish';
import { VoteAttributes } from '@/models/vote';
import { DishAttributes } from '@/models/dish';

import { SubmitVoteOptionsRequest, GetTodayVoteResultRequest ,FinalizeVotePollRequest,GetUpComingMealRequest,GetTodayVotePoll} from '@/types/requests.js';
import { promises } from 'dns';

const VotePoll = db.VotePoll;
const CandidateDish = db.CandidateDish;
const Dish = db.Dish; 
const Vote = db.Vote;

// Define interfaces for request objects
interface VotePollWithAssociations extends VotePollAttributes {
  CandidateDishes: (CandidateDishAttributes & {
    Dish: DishAttributes;
  })[]; 
}

//Define the response structure for each dish
interface DishVoteResult {
  candidateDishId : number,
  dishId : number,
  dish: DishAttributes,
  voteCount : number
}

// Create a new vote poll
export const submitVoteOptions = async (req: SubmitVoteOptionsRequest, res: Response): Promise<Response> => {
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
    if (isNaN(parsedMealDate.getTime())) {
      return res.status(400).json({ error: 'Invalid mealDate format (YYYY-MM-DD expected)' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedMealDate < today) {
      return res.status(400).json({ error: 'Cannot set vote for past meal date' });
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

    const normalizedDishIds = dishIds.map((id: any) => Number(id));
    const dishes = await Dish.findAll({ where: { id: normalizedDishIds } });

    // Use .get("id") to avoid shadowing issue
    const existingIds = dishes.map(d => Number(d.get("id")));
    const invalidDishIds = normalizedDishIds.filter(id => !existingIds.includes(id));

    if (invalidDishIds.length > 0) {
      return res.status(400).json({
        error: "Some dishIds do not exist",
        invalidDishIds
      });
    }

    // Calculate vote date (1 day before meal date)
    const voteDate = new Date(parsedMealDate);
    voteDate.setDate(voteDate.getDate() - 1);
    if (voteDate < today) {
      return res.status(400).json({ error: 'Vote date cannot be in the past' });
    }

    // Create vote poll
    const pollInstance = await VotePoll.create({
  mealDate: parsedMealDate,
  voteDate,
  userId: req.user.id
} as VotePollCreationAttributes);

// Extract only the raw data
const poll = pollInstance.get({ plain: true });

    // Link submitted dishes to poll
    // const candidates: CandidateDishCreationAttributes[] = dishIds.map(dishId => ({
    //   votePollId: poll.id,
    //   dishId,
    //   isSelected: false,
    // }));
    console.log("vote poll id: ", poll.id);
    const candidates: CandidateDishCreationAttributes[] = dishIds.map(dishId => ({
      votePollId: poll.id!,
      dishId,
      isSelected: false,
    }));

    console.log("====================outside==================")
    candidates.map((e)=> {
      console.log(e.id + " : " + e.votePollId);
    });
    await CandidateDish.bulkCreate(candidates);
   
    return res.status(201).json({
      message: 'Vote poll created successfully',
      pollId: poll.id
    });

  } catch (error: any) {
    console.error('Error creating vote poll:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const getTodayVoteResult = async (req: GetTodayVoteResultRequest, res: Response): Promise<Response> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find today's vote poll
    const poll = await VotePoll.findOne({
      where: {
        voteDate: { [Op.gte]: today, [Op.lt]: tomorrow },
        status: { [Op.in]: ["open", "close"] },
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
      return res.status(404).json({ message: "No poll for today." });
    }


    const plainPoll = poll.get({ plain: true }) as any;

    console.log(plainPoll);

    // Count the number of votes for each dish
    const dishesWithVotes: DishVoteResult[] = await Promise.all(
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
      status: plainPoll.status,
      dishes: dishesWithVotes,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error cannot get vote result." });
  }
};

export const finalizeVotePoll = async (req: FinalizeVotePollRequest, res: Response) => {
  try {
    const pollId = Number(req.params.id);
    const { selectedDishIds } = req.body as { selectedDishIds: number[] };

    // Load poll with CandidateDish (no alias)
    const poll = await VotePoll.findByPk(pollId, {
      include: [CandidateDish],
    });



    if (!poll) return res.status(404).json({ message: "Poll not found." });

    const plainPoll = poll.get({ plain: true }) as any;
    console.log("p pole");
    console.log(plainPoll);

    console.log("CandidateDishes for poll:", JSON.stringify((plainPoll as any).CandidateDishes, null, 2));

    if (poll.status !== "close")
      return res.status(400).json({ message: "Only closed votePoll can be finalized." });


    // Determine where Sequelize attached the candidate dishes

    console.log("cp");
    console.log(plainPoll.CandidateDishes);
    const candidates =
      (plainPoll as any).CandidateDishes;


    console.log("cc");
    console.log(candidates);
    if (candidates.length === 0)
      return res.status(400).json({ message: "This poll has no candidate dishes." });


    // Validate selected dishes
    const candidateDishIds = candidates.map((cd: any) => cd.dishId);
    const invalidDishes = selectedDishIds.filter((id) => !candidateDishIds.includes(id));
    if (invalidDishes.length > 0)
      return res.status(400).json({
        message: "Some selected dishes are not candidates for this poll.",
        invalidDishes,
      });

    // Update isSelected for finalized dishes
      await CandidateDish.update(
      { isSelected: true },
      {
        where: {
          votePollId: pollId,
          dishId: selectedDishIds,
        },
      }
    );

    // Update poll status
    poll.status = "finalized";
    await poll.save();

    return res.status(200).json({
      message: "Poll finalized successfully.",
      pollId,
      finalizedDishes: selectedDishIds,
    });
  } catch (error) {
    console.error(" Error in finalizedVotePoll:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const getUpCommingMeal = async (req: GetUpComingMealRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the most recent finalized poll (today or earlier), but still relevant
    const poll = await VotePoll.findOne({
      where: { status: "finalized" },
      include: [
        {
          model: CandidateDish,
          where: { isSelected: true },
          include: [
            {
              model: Dish,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
          ],
          attributes: { exclude: ["createdAt", "updatedAt"] },
        },
      ],
      order: [["mealDate", "DESC"]], // latest finalized meal
      attributes: { exclude: ["createdAt", "updatedAt"] },
    });

    if (!poll) {
      return res.status(404).json({ message: "No upcoming meal available." });
    }

    const plainPoll = poll.get({ plain: true }) as any;

    return res.status(200).json({
      votePollId: plainPoll.id,
      mealDate: plainPoll.mealDate,
      voteDate: plainPoll.voteDate,
      status: plainPoll.status,
      dish: plainPoll.CandidateDishes,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error cannot get upcoming meal",
    });
  }
};

export const getTodayVotePoll = async (req: GetTodayVoteResultRequest, res: Response): Promise<Response> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find today's vote poll
    const poll = await VotePoll.findOne({
      where: {
        voteDate: { [Op.gte]: today, [Op.lt]: tomorrow },
        status: { [Op.in]: ["open", "close"] },
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
      return res.status(404).json({ message: "No poll for today." });
    }


    const plainPoll = poll.get({ plain: true }) as any;

    console.log(plainPoll);

    // Count the number of votes for each dish
    const dishesWithVotes: DishVoteResult[] = await Promise.all(
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
      status: plainPoll.status,
      dishes: dishesWithVotes,
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error cannot get votePoll." });
  }
};
