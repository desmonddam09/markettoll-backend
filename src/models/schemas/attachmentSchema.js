import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, required: true },
  },
  {
    timestamps: true
  }
);

export default attachmentSchema;
