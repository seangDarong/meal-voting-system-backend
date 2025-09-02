    import sequelize from "@/config/db";
    import User from "@/models/user";
    import Dish from "@/models/dish";
    import Category from "@/models/category";
    import Vote from "@/models/vote";
    import VotePoll from "@/models/votePoll";
    import CandidateDish from "@/models/candidateDish";
    import WishList from "@/models/wishList";
    import VoteHistory from "@/models/voteHistory";
    import Feedback from "@/models/feedback";
    import CandidateDishHistory from "@/models/candidateDishHistory";

    // Associations

    // Category -> Dish
    Category.hasMany(Dish, { foreignKey: "categoryId", onDelete: "CASCADE" });
    Dish.belongsTo(Category, { foreignKey: "categoryId" });

    // Dish -> CandidateDish
    Dish.hasMany(CandidateDish, { foreignKey: "dishId", onDelete: "CASCADE" });
    CandidateDish.belongsTo(Dish, { foreignKey: "dishId" });

    // VotePoll -> CandidateDish
    VotePoll.hasMany(CandidateDish, { foreignKey: "votePollId", onDelete: "CASCADE" });
    CandidateDish.belongsTo(VotePoll, { foreignKey: "votePollId" });

    // User -> Vote
    User.hasMany(Vote, { foreignKey: "userId", onDelete: "CASCADE" });
    Vote.belongsTo(User, { foreignKey: "userId" });

    // User -> VotePoll
    User.hasMany(VotePoll, { foreignKey: "userId", onDelete: "CASCADE" });
    VotePoll.belongsTo(User, { foreignKey: "userId" });

    // User -> Dish
    User.hasMany(Dish, { foreignKey: "userId", onDelete: "CASCADE" });
    Dish.belongsTo(User, { foreignKey: "userId" });

    // User -> WishList
    User.hasOne(WishList, { foreignKey: "userId", onDelete: "CASCADE" });
    WishList.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });

    // Dish -> WishList
    Dish.hasMany(WishList, { foreignKey: "dishId", onDelete: "CASCADE" });
    WishList.belongsTo(Dish, { foreignKey: "dishId", onDelete: "CASCADE" });

    // Dish -> VoteHistory
    Dish.hasMany(VoteHistory, { foreignKey: "dishId" });
    VoteHistory.belongsTo(Dish, { foreignKey: "dishId", onDelete: "CASCADE" });

    // Dish -> CandidateDishHistory
    Dish.hasMany(CandidateDishHistory, { foreignKey: "dishId", onDelete: "CASCADE" });
    CandidateDishHistory.belongsTo(Dish, { foreignKey: "dishId" });

    // Dish -> Vote
    Dish.hasMany(Vote, { foreignKey: "dishId", onDelete: "CASCADE" });
    Vote.belongsTo(Dish, { foreignKey: "dishId" });

    // VotePoll -> Vote
    VotePoll.hasMany(Vote, { foreignKey: "votePollId", onDelete: "CASCADE" });
    Vote.belongsTo(VotePoll, { foreignKey: "votePollId" });

    // DB interface
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

    // DB object
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
    CandidateDishHistory,
    };

    export default db;
