import mongoose from 'mongoose';
import { productSubCategorySchema } from './schemas/index.js';
import { throwError } from '../utils/index.js';

const productCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    subCategories: {
      type: [productSubCategorySchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

productCategorySchema.statics.getProductCategories = async function () {
  const productCategories = await this.find().sort({ name: 1 });
  return productCategories;
};

productCategorySchema.statics.addCategory = async function (name, image) {
  const category = await this.findOne({ name });
  if (category) {
    throwError(409, 'Category with this name already exists.');
  }

  const newDoc = new this({ name, image });
  await newDoc.save();
};

productCategorySchema.statics.addSubcategory = async function (name, subcategory) {
  const category = await this.findOne({ name });
  if (!category) {
    throwError(404, 'Category not found.');
  }

  const matchingSubcategoryNames = subcategory.names.filter(subName =>
    category.subCategories.some(catSub => catSub.name === subName)
  );

  if (matchingSubcategoryNames.length > 0) {
    throwError(409, `Subcategory with this name already exists "${matchingSubcategoryNames}".`);
  }

  for (let i = 0; i < subcategory.names.length; i++) {
    category.subCategories.push({ name: subcategory.names[i], image: subcategory.images[i] });
  }
  await category.save();
};

export default mongoose.model('productCategory', productCategorySchema);
