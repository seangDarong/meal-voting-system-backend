import { Request, Response } from 'express';
import Feedback from '@/models/feedback';
import { FeedbackAttributes, FeedbackCreationAttributes } from '@/models/feedback';

import {CreateFeedbackRequest, GetFeedbackRequest } from "@/types/requests"


// Create feedback
export const createFeedback = async (req: CreateFeedbackRequest, res: Response): Promise<Response> => {
  try {
    const { canteen, system, content } = req.body;

    // Check if at least one field is provided
    if (
      typeof canteen !== 'number' &&
      typeof system !== 'number' &&
      (typeof content !== 'string' || content.trim().length === 0)
    ) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one feedback field (canteen, system, or content) is required.' 
      });
    }

    await Feedback.create({
      canteen: typeof canteen === 'number' ? canteen : null,
      system: typeof system === 'number' ? system : null,
      content: typeof content === 'string' ? content.trim() : null
    } as FeedbackCreationAttributes);

    return res.status(201).json({ 
      success: true, 
      message: 'Feedback submitted anonymously.' 
    });
  } catch (error: any) {
    console.error('Feedback error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Feedback error: Error submitting feedback.' 
    });
  }
};

// Get feedback
export const getFeedback = async (req: GetFeedbackRequest, res: Response): Promise<Response> => {
  try {
    // Parse pagination params
    let { limit = '10', offset = '0' } = req.query;
    let limitNum = parseInt(limit, 10);
    let offsetNum = parseInt(offset, 10);

    // Cap to safe limits
    if (isNaN(limitNum) || limitNum <= 0) limitNum = 10;
    if (limitNum > 50) limitNum = 50; // max 50 per request
    if (isNaN(offsetNum) || offsetNum < 0) offsetNum = 0;

    // Fetch feedback with pagination + ordering
    const { count: total, rows } = await Feedback.findAndCountAll({
      attributes: ["id", "canteen", "system", "content", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset: offsetNum
    });

    // Calculate nextOffset (if more items exist)
    const nextOffset = offsetNum + limitNum < total ? offsetNum + limitNum : null;

    return res.status(200).json({
      success: true,
      items: rows,
      total,
      nextOffset,
      currentLimit: limitNum,
      currentOffset: offsetNum
    });
  } catch (error: any) {
    console.error("Feedback error:", error);
    return res.status(500).json({
      success: false,
      error: "Feedback error: Error fetching feedback."
    });
  }
};