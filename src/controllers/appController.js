import { populateProductCategoryModel } from '../scripts/index.js';
import { errorLogModel } from '../models/index.js';

export const populate = async (req, res, next) => {
  try {
    await populateProductCategoryModel();
    res.status(200).json({
      success: true,
      message: 'Database populated successfully.',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const { page } = req.query;
    const limit = 100;
    const skip = (page - 1) * limit;
    let query = {};
    // query = {
    //   ...query,
    //   $and: [
    //     {
    //       'data.message': {
    //         $not: { $regex: 'Route not found', $options: 'i' },
    //       },
    //     },
    //     {
    //       'data.message': {
    //         $not: { $regex: 'jwt malformed', $options: 'i' },
    //       },
    //     },
    //     {
    //       'data.message': {
    //         $not: {
    //           $regex: 'No push notification tokens available', $options: 'i'
    //         },
    //       },
    //     },
    //   ],
    // };
    query = {
      ...query,
      'data.status': 500,
    };

    const logs = await errorLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    res.status(200).json(logs);
  } catch (error) {
    console.log(error);
  }
};
