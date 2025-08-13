import sequelize from "../config/db.js";
import User from '../models/user.js';
import Dish from '../models/dish.js';
import Category from '../models/category.js';
import Vote from '../models/vote.js';
import VotePoll from '../models/votePoll.js';
import CandidateDish from '../models/candidateDish.js';
import WishList from './wishList.js'
import VoteHistory from '../models/voteHistory.js';
import Feedback from '../models/feedback.js';
import CandidateDishHistory from '../models/candidateDishHistory.js';

//Association
Category.hasMany(Dish,{foreignKey: 'categoryId',onDelete: 'CASCADE'});
Dish.belongsTo(Category,{foreignKey: 'categoryId'});

Dish.hasMany(CandidateDish,{foreignKey: 'dishId',onDelete: 'CASCADE'});
CandidateDish.belongsTo(Dish,{foreignKey: 'dishId'});

VotePoll.hasMany(CandidateDish, { foreignKey: 'votePollId', onDelete: 'CASCADE' });
CandidateDish.belongsTo(VotePoll, { foreignKey: 'votePollId' });

User.hasMany(Vote,{foreignKey: 'userId',onDelete: 'CASCADE'});
Vote.belongsTo(User,{foreignKey: 'userId'});

User.hasMany(VotePoll,{foreignKey: 'userId',onDelete: 'CASCADE'});
VotePoll.belongsTo(User,{foreignKey: 'userId'});

User.hasMany(Dish,{foreignKey: 'userId',onDelete: 'CASCADE'});
Dish.belongsTo(User,{foreignKey: 'userId'});

User.hasOne(WishList,{foreignKey: 'userId',onDelete: 'CASCADE'});
WishList.belongsTo(User,{foreignKey: 'userId',onDelete: 'CASCADE'});

Dish.hasMany(WishList,{foreignKey: 'dishId',onDelete: 'CASCADE'});
WishList.belongsTo(Dish,{foreignKey: 'dishId',onDelete: 'CASCADE'});

VoteHistory.belongsTo(Dish, { foreignKey: 'dishId', onDelete: 'CASCADE' });
Dish.hasMany(VoteHistory, { foreignKey: 'dishId' });

Dish.hasMany(CandidateDishHistory, { foreignKey: 'dishId', onDelete: 'CASCADE' });
CandidateDishHistory.belongsTo(Dish, { foreignKey: 'dishId' });


Dish.hasMany(CandidateDish, { foreignKey: 'dishId', onDelete: 'CASCADE' });
CandidateDish.belongsTo(Dish, { foreignKey: 'dishId' });


const db = {
    sequelize,
    User,
    Dish,
    Category,
    Vote,
    VotePoll,
    CandidateDish,
    WishList,
    VoteHistory,
    Feedback,
    CandidateDishHistory

}

export default db;