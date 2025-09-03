import { Request, Response } from "express";
import Feedback, { FeedbackCreationAttributes } from "@/models/feedback";

// -------- Types for requests --------
interface CreateFeedbackBody {
  canteen?: number;
  system?: number;
  content?: string;
}

interface CreateDishFeedbackBody {
  food?: number;
  content?: string;
}

interface PaginatedQuery {
  limit?: string;
  offset?: string;
}

interface DishParam {
  dishId: string;
}

// -------- Create anonymous feedback --------
export const createFeedback = async (
  req: Request<unknown, unknown, CreateFeedbackBody>,
  res: Response
): Promise<Response> => {
  try {
    // Check if cookie exists
    if (req.cookies?.lastFeedback) {
      const lastFeedbackTime = new Date(req.cookies.lastFeedback);
      const now = new Date();

      const diffMinutes = Math.floor((now.getTime() - lastFeedbackTime.getTime()) / (1000 * 60));
      if (diffMinutes < 5) {
        return res.status(429).json({
          success: false,
          error: `Please wait ${5 - diffMinutes} more minute(s) before submitting again.`,
        });
      }
    }

    const { canteen, system, content } = req.body;

    if (
      typeof canteen !== "number" &&
      typeof system !== "number" &&
      (typeof content !== "string" || content.trim().length === 0)
    ) {
      return res.status(400).json({
        success: false,
        error: "At least one feedback field (canteen, system, or content) is required.",
      });
    }

    await Feedback.create({
      canteen: typeof canteen === "number" ? canteen : null,
      system: typeof system === "number" ? system : null,
      content: typeof content === "string" ? content.trim() : null,
    } as FeedbackCreationAttributes);

    // Set/update cookie (expires in 5 minutes)
    res.cookie("lastFeedback", new Date().toISOString(), {
      httpOnly: true,
      maxAge: 5 * 60 * 1000,
    });

    return res.status(201).json({ success: true, message: "Feedback submitted anonymously." });
  } catch (error: any) {
    console.error("Feedback error:", error);
    return res.status(500).json({
      success: false,
      error: "Feedback error: Error submitting feedback.",
    });
  }
};

// -------- Get anonymous feedback --------
export const getFeedback = async (
  req: Request<unknown, unknown, unknown, PaginatedQuery>,
  res: Response
): Promise<Response> => {
  try {
    let { limit = "10", offset = "0" } = req.query;
    let limitNum = parseInt(limit, 10);
    let offsetNum = parseInt(offset, 10);

    if (isNaN(limitNum) || limitNum <= 0) limitNum = 10;
    if (limitNum > 50) limitNum = 50;
    if (isNaN(offsetNum) || offsetNum < 0) offsetNum = 0;

    const { count: total, rows } = await Feedback.findAndCountAll({
      where: { dishId: null },
      attributes: ["id", "canteen", "system", "content", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset: offsetNum,
    });

    const nextOffset = offsetNum + limitNum < total ? offsetNum + limitNum : null;

    return res.status(200).json({
      success: true,
      items: rows,
      total,
      nextOffset,
    });
  } catch (error: any) {
    console.error("Feedback error:", error);
    return res.status(500).json({
      success: false,
      error: "Feedback error: Error fetching feedback.",
    });
  }
};

// -------- Create feedback for a dish --------
export const createFeedbackForDish = async (
  req: Request<DishParam, unknown, CreateDishFeedbackBody>,
  res: Response
): Promise<Response> => {
  try {
    const { dishId } = req.params;
    const { food, content } = req.body;

    if (req.cookies?.feedbackSubmitted) {
      return res.status(429).json({
        success: false,
        error: "You have already submitted feedback recently. Please wait before submitting again.",
      });
    }

    if (!dishId || isNaN(parseInt(dishId))) {
      return res.status(400).json({ success: false, error: "Valid dishId is required." });
    }

    const hasFood = typeof food === "number" && food >= 1 && food <= 5;
    const hasContent = typeof content === "string" && content.trim().length > 0;

    if (!hasFood && !hasContent) {
      return res.status(400).json({
        success: false,
        error: "You must provide either a food rating (1-5) or content.",
      });
    }

    await Feedback.create({
      dishId: parseInt(dishId, 10),
      food: hasFood ? food : null,
      content: hasContent ? content.trim() : null,
    } as FeedbackCreationAttributes);

    res.cookie("feedbackSubmitted", "true", {
      maxAge: 300000,
      httpOnly: true,
      sameSite: "strict",
    });

    return res.status(201).json({ success: true, message: "Feedback for dish submitted." });
  } catch (error: any) {
    console.error("Feedback error:", error);
    return res.status(500).json({ success: false, error: "Error submitting dish feedback." });
  }
};

// -------- Get all feedback for a dish --------
export const getAllDishFeedback = async (
  req: Request<DishParam>,
  res: Response
): Promise<Response> => {
  try {
    const { dishId } = req.params;

    if (!dishId || isNaN(parseInt(dishId))) {
      return res.status(400).json({ success: false, error: "Valid dishId is required." });
    }

    const feedbacks = await Feedback.findAll({
      where: { dishId: parseInt(dishId, 10) },
      attributes: ["id", "food", "content", "createdAt"],
    });

    const ratings = feedbacks.map((fb) => fb.food).filter((r): r is number => typeof r === "number");
    const count = ratings.length;
    const average = count > 0 ? (ratings.reduce((a, b) => a + b, 0) / count).toFixed(2) : null;

    return res.status(200).json({
      success: true,
      dishId: parseInt(dishId, 10),
      averageFoodRating: average,
      totalRatings: count,
      feedbacks,
    });
  } catch (error: any) {
    console.error("Get all dish feedback error:", error);
    return res.status(500).json({ success: false, error: "Error fetching dish feedback." });
  }
};
