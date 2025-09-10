import cron from "node-cron";
import db from "@/models/index";
import { Op } from "sequelize";

const votePoll = db.VotePoll;

// Helper to get start and end of today
function getTodayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
}

// Open votePoll every minute (for testing)
cron.schedule(
"0 6 * * *",
async () => {
    try {
    console.log("Cron: Opening today's poll");

    const { start, end } = getTodayRange();
    console.log("Today's range:", start, end);

    const poll = await votePoll.findOne({
        where: {
        voteDate: {
            [Op.gte]: start,
            [Op.lt]: end,
        },
        status: "pending",
        },
    });

    if (poll) {
        poll.status = "open";
        await poll.save();
        console.log(`Poll ${poll.id} opened`);
    } else {
        console.log("No pending poll found for today.");
    }
    } catch (error) {
    console.error("Error opening poll:", error);
    }
},
{ timezone: "Asia/Phnom_Penh" }
);

// Close votePoll at 4pm
cron.schedule(
"0 16 * * *",
async () => {
    // For testing, runs every minute
    try {
        console.log("Cron: Closing today's poll");

        const { start, end } = getTodayRange();
        console.log("Today's range:", start, end);

        const poll = await votePoll.findOne({
            where: {
            voteDate: {
                [Op.gte]: start,
                [Op.lt]: end,
            },
            status: "open",
        },
    });

    if (poll) {
        poll.status = "close";
        await poll.save();
        console.log(`Poll ${poll.id} closed`);
    } else {
        console.log("No open poll found for today.");
    }
    } catch (error) {
    console.error("Error closing poll:", error);
    }
},
{ timezone: "Asia/Phnom_Penh" }
);
console.log("cronJob.js loaded");

console.log("Cron callback triggered");