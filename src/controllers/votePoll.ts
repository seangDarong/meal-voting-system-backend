import { Request, Response } from 'express';
import { Op } from 'sequelize';
import db from '@/models/index';
import { VotePollAttributes, VotePollCreationAttributes } from '@/models/votePoll';
import { CandidateDishAttributes, CandidateDishCreationAttributes } from '@/models/candidateDish';
import { VoteAttributes } from '@/models/vote';
import { DishAttributes } from '@/models/dish';

import { SubmitVoteOptionsRequest, GetActiveVotePollRequest, GetTodayVoteResultRequest } from '@/types/requests.js';


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

interface VoteCountResult {
  dishId: number;
  count: number;
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
    } as VotePollCreationAttributes);

    // Link submitted dishes to poll
    const candidates: CandidateDishCreationAttributes[] = dishIds.map(dishId => ({
      votePollId: poll.id,
      dishId,
      isSelected: false
    }));
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

// Get active vote poll for today
export const getActiveVotePoll = async (req: GetActiveVotePollRequest, res: Response): Promise<Response> => {
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
    }) as unknown as VotePollWithAssociations | null;

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

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error cannot get active vote poll' });
  }
};

export const getTodayVoteResult = async (req: GetTodayVoteResultRequest, res: Response): Promise<Response> => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const poll = await VotePoll.findOne({
      where: {
        voteDate: { [Op.between]: [startOfDay, endOfDay] }
      },
      include: [
        {
          model: CandidateDish,
          include: [Dish]
        }
      ]
    }) as unknown as VotePollWithAssociations | null;

    if (!poll) {
      return res.status(404).json({ error: "No active vote poll today" });
    }

    // Count votes per dishId
    const votes = await Vote.findAll({
      where: { votePollId: poll.id },
      attributes: [
        'dishId',
        [db.sequelize.fn('COUNT', db.sequelize.col('dishId')), 'count']
      ],
      group: ['dishId']
    }) as unknown as VoteCountResult[];

    // Map votes for easy lookup
    const voteMap: Record<number, number> = {};
    votes.forEach(v => {
      voteMap[v.dishId] = parseInt((v as any).get('count') as string);
    });

    // Include all candidate dishes, even zero-vote dishes
    const voteCounts = poll.CandidateDishes.map(cd => ({
      dishId: cd.dishId,
      name: cd.Dish.name,
      category: cd.Dish.categoryId,
      image: cd.Dish.imageURL,
      count: voteMap[cd.dishId] || 0
    }));

    return res.status(200).json({
      pollId: poll.id,
      mealDate: poll.mealDate,
      results: voteCounts
    });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error cannot get vote result.' });
  };
};