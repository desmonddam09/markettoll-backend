import mongoose from 'mongoose';

const errorLogsSchema = new mongoose.Schema(
  {
    data: { type: Object, required: true }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('errorLog', errorLogsSchema);
