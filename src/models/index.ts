import sequelize from "@/config/db";
import User from '@/models/user';
import Dish from '@/models/dish';
import Category from '@/models/category';
import Vote from '@/models/vote';
import VotePoll from '@/models/votePoll';
import CandidateDish from '@/models/candidateDish';
import WishList from '@/models/wishList'
import VoteHistory from '@/models/voteHistory';
import Feedback from '@/models/feedback';
import CandidateDishHistory from '@/models/candidateDishHistory';

//Association
Category.hasMany(Dish,{foreignKey: 'categoryId',onDelete: 'CASCADE'});
Dish.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

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

// Associations (ensure FK types match UUID)
User.hasMany(WishList, { foreignKey: 'userId', sourceKey: 'id', onDelete: 'CASCADE' });
WishList.belongsTo(User, { foreignKey: 'userId', targetKey: 'id' });

Dish.hasMany(WishList,{foreignKey: 'dishId',onDelete: 'CASCADE'});
WishList.belongsTo(Dish,{foreignKey: 'dishId',onDelete: 'CASCADE'});

VoteHistory.belongsTo(Dish, { foreignKey: 'dishId', onDelete: 'CASCADE' });
Dish.hasMany(VoteHistory, { foreignKey: 'dishId' });

Dish.hasMany(CandidateDishHistory, { foreignKey: 'dishId', onDelete: 'CASCADE' });
CandidateDishHistory.belongsTo(Dish, { foreignKey: 'dishId' });


Dish.hasMany(CandidateDish, { foreignKey: 'dishId', onDelete: 'CASCADE' });
CandidateDish.belongsTo(Dish, { foreignKey: 'dishId' });
// add a new column to make it have erraltionship with dishId and VotePollId
Dish.hasMany(Vote, { foreignKey: 'dishId', onDelete: 'CASCADE' });
Vote.belongsTo(Dish, { foreignKey: 'dishId' });

VotePoll.hasMany(Vote, { foreignKey: 'votePollId', onDelete: 'CASCADE' });
Vote.belongsTo(VotePoll, { foreignKey: 'votePollId' });

interface Database {
    sequelize: typeof sequelize;
    User: typeof User;
    Dish: typeof Dish;
    Category: typeof Category;
    Vote: typeof Vote;
    VotePoll: typeof VotePoll;
    CandidateDish: typeof CandidateDish;
    WishList: typeof WishList;
    VoteHistory: typeof VoteHistory;
    Feedback: typeof Feedback;
    CandidateDishHistory: typeof CandidateDishHistory;
}

const db: Database = {
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
};

export default db;