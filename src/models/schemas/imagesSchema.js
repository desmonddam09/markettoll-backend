import mongoose from 'mongoose';

const imagesSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    displayImage: { type: Boolean, required: true }
  },
  {
    timestamps: true
  }
);

export default imagesSchema;
