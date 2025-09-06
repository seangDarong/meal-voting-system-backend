import { Request, Response } from "express";
import Feedback, { FeedbackCreationAttributes } from "@/models/feedback";

// -------- Types for requests --------

interface CreateDishFeedbackBody {
  food?: number;
  content?: string;
}

interface DishParam {
  dishId: string;
}

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
