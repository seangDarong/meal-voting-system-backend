import sequelize from "../config/db.js";
import User from '../models/user.js';
import Dish from '../models/dish.js';
import Category from '../models/category.js';
import Vote from '../models/vote.js';
import VotePoll from '../models/votePoll.js';
import CandidateDish from '../models/candidateDish.js';
import WhistList from '../models/whishList.js'


//Association
Category.hasMany(Dish,{foreignKey: 'categoryId',onDelete: 'CASCADE'});
Dish.belongsTo(Category,{foreignKey: 'categoryId'});

Dish.hasMany(CandidateDish,{foreignKey: 'dishId',onDelete: 'CASCADE'});
CandidateDish.belongsTo(Dish,{foreignKey: 'dishId'});

CandidateDish.hasOne(VotePoll,{foreignKey: 'candidateDishId',onDelete: 'CASCADE'});
VotePoll.belongsTo(CandidateDish,{foreignKey: 'candidateDishId'});

VotePoll.hasMany(Vote,{foreignKey: 'pollId',onDelete: 'CASCADE'});
Vote.belongsTo(VotePoll,{foreignKey: 'pollId'});

User.hasMany(Vote,{foreignKey: 'userId',onDelete: 'CASCADE'});
Vote.belongsTo(User,{foreignKey: 'userId'});

User.hasMany(VotePoll,{foreignKey: 'userId',onDelete: 'CASCADE'});
VotePoll.belongsTo(User,{foreignKey: 'userId'});

User.hasMany(Dish,{foreignKey: 'userId',onDelete: 'CASCADE'});
Dish.belongsTo(User,{foreignKey: 'userId'});

User.hasOne(WhistList,{foreignKey: 'userId',onDelete: 'CASCADE'});
WhistList.belongsTo(User,{foreignKey: 'userId',onDelete: 'CASCADE'});

Dish.hasMany(WhistList,{foreignKey: 'dishId',onDelete: 'CASCADE'});
WhistList.belongsTo(Dish,{foreignKey: 'dishId',onDelete: 'CASCADE'});


const db = {
    sequelize,
    User,
    Dish,
    Category,
    Vote,
    VotePoll,
    CandidateDish,
    WhistList
}

export default db;