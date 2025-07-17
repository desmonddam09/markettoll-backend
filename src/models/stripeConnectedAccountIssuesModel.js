import mongoose from 'mongoose';

const stripeConnectedAccountIssuesSchema = new mongoose.Schema(
  {
    event: { type: Object, default: () => { } }
  },
  {
    timestamps: true
  });


export default mongoose.model('stripeConnectedAccountIssues', stripeConnectedAccountIssuesSchema);
