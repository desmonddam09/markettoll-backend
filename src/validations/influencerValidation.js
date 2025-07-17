import Joi from 'joi';
import mongoose from 'mongoose';


const updateInfluencerSettingsSchema = Joi.object({
    influencerStatus: Joi.string()
      .valid('auto', 'manual')
      .required()
      .messages({
        'any.required': 'influencerStatus is required.',
        'any.only': 'influencerStatus must be either "auto" or "manual".',
      }),
  });

  const influencerRateSchema = Joi.object({
    user: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      }, 'ObjectId Validation')
      .messages({
        'any.required': 'user is required',
        'any.invalid': 'Invalid user format',
      }),
    influencerRate: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'influencerRate must be a number',
        'number.min': 'influencerRate cannot be less than 0',
        'any.required': 'influencerRate is required',
      }),
  });

  const allInfluencerRatesSchema = Joi.object({
    influencerRate: Joi.number()
      .min(0)
      .required()
      .messages({
        'number.base': 'influencerRate must be a number',
        'number.min': 'influencerRate cannot be less than 0',
        'any.required': 'influencerRate is required',
      }),
  });

  const payoutRequestSchema = Joi.object({
    amount: Joi.number().positive().required().messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be greater than 0',
      'any.required': 'Amount is required'
    })
  });

  const payoutActionSchema = Joi.object({
    payoutRequestId: Joi.string().required(),
    action: Joi.string().valid('approve', 'reject').required()
  });

  const approveAffiliateSchema = Joi.object({
  influencer: Joi.string().required().messages({
    'any.required': 'influencer ID is required',
    'string.empty': 'influencer ID cannot be empty'
  }),
});

const toggleReferralStatusSchema = Joi.object({
  influencer: Joi.string().required().messages({
    'any.required': 'influencer is required.',
    'string.empty': 'influencer cannot be empty.',
  }),
  isActive: Joi.boolean().required().messages({
    'any.required': 'isActive is required.',
  }),
});

 const influencerGoalschema = Joi.object({
      totalReferrals: Joi.number().required().min(0),
      influencerRate: Joi.number().required().min(0)
    });

    export const updateInfluencerGoalschema = Joi.object({
  totalReferrals: Joi.number().min(0),
  influencerRate: Joi.number().min(0)
}).or('totalReferrals', 'influencerRate');

const updateInfluencerRateSettingsSchema = Joi.object({
    rateStatus: Joi.string()
      .valid('auto', 'manual')
      .required()
      .messages({
        'any.required': 'rateStatus is required.',
        'any.only': 'rateStatus must be either "auto" or "manual".',
      }),
  });

  const updateAffiliateGoalSchema = Joi.object({
  totalReferrals: Joi.number().min(0),
  influencerRate: Joi.number().min(0)
}).or('totalReferrals', 'influencerRate');


 export {
   updateInfluencerSettingsSchema,
   influencerRateSchema,
   updateInfluencerRateSettingsSchema,
   allInfluencerRatesSchema,
   toggleReferralStatusSchema,
   payoutRequestSchema,
   payoutActionSchema,
   approveAffiliateSchema,
   influencerGoalschema,
   updateAffiliateGoalSchema,
 }; 