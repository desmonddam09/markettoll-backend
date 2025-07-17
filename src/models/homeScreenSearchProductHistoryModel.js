import mongoose from 'mongoose';

const homeScreenSearchProductHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
      unique: true
    },
    keywords: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

homeScreenSearchProductHistorySchema.statics.addKeywordToUserHistory = async function (userId, word) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const searchHistory = await this.findOne({ user: userId }).session(session);

    if (!searchHistory) {
      const newHistory = this({
        user: userId,
        keywords: [word]
      });
      await newHistory.save({ session });
      await session.commitTransaction();
      await session.endSession();
      return newHistory;
    } else {
      if (!searchHistory.keywords.includes(word)) {
        searchHistory.keywords.unshift(word);
        if (searchHistory.keywords.length > 10) {
          searchHistory.keywords.pop();
        }
        await searchHistory.save({ session });
      }
      await session.commitTransaction();
      await session.endSession();
      return searchHistory;
    }
  } catch (err) {
    await session.abortTransaction();
    await session.endSession();
    throw err;
  }
};

homeScreenSearchProductHistorySchema.statics.getUserHistory = async function (userId) {
  const history = await this.findOne({ user: userId });
  return history;
};

export default mongoose.model('homeScreenSearchProductHistory', homeScreenSearchProductHistorySchema);
