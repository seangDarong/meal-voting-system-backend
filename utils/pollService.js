import db from '../models/index.js'
const votePoll = db.VotePoll;

export const openPoll = async (pollId) => {
    const poll = await votePoll.findByPk(pollId);
    if (!poll) throw new Error('Poll not found');
    poll.status = 'open';
    await poll.save();
    return poll;
}

export const closePoll = async (pollId) => {
    const poll = await votePoll.findByPk(pollId);
    if (!poll) throw new Error('Poll not found');
    poll.status = 'close';
    await poll.save();
    return poll;

}