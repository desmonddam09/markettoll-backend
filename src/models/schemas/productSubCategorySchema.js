import mongoose from 'mongoose';

const productSubCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default productSubCategorySchema;
