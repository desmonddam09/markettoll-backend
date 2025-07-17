import { productCategoryModel } from '../models/index.js';

const imageUrl = 'https://markettollbucket.s3.amazonaws.com/categories/9be21db4-9807-4f83-8f05-abccbd6d7e09';

const categories = [
  {
    name: 'Electronics',
    image: 'https://markettollbucket.s3.amazonaws.com/categories/electronics/1215b7a7-8f71-4bae-bde6-3a645208f6a3',
    subCategories: [
      { name: 'Mobile Phones', image: 'https://markettollbucket.s3.amazonaws.com/categories/electronics/subCategories/a3e29fba-b137-4b7a-9f7b-3eb98bd3068e' },
      { name: 'Laptops', image: imageUrl },
      { name: 'Computers', image: 'https://markettollbucket.s3.amazonaws.com/categories/electronics/subCategories/b7165a22-a12a-4cb9-87a9-10fa779fa103' },
      { name: 'Tablets', image: 'https://markettollbucket.s3.amazonaws.com/categories/electronics/subCategories/a651c632-6efe-4ab4-b5a6-550381770129' },
      { name: 'Cameras', image: imageUrl },
      { name: 'Audio & Headphones', image: 'https://markettollbucket.s3.amazonaws.com/categories/electronics/subCategories/b2ff4315-7a63-4905-a8da-495d17429786' },
      { name: 'Wearable Technology', image: imageUrl },
      { name: 'Accessories', image: imageUrl },
    ],
  },
  {
    name: 'Home Appliances',
    image: 'https://markettollbucket.s3.amazonaws.com/categories/homeAppliances/56e9b4e5-5c56-42ba-bf1e-8cd246c91e5d',
    subCategories: [
      { name: 'Kitchen Appliances', image: imageUrl },
      { name: 'Large Appliances', image: imageUrl },
      { name: 'Small Appliances', image: imageUrl },
      { name: 'Heating & Cooling', image: imageUrl },
      { name: 'Laundry Appliances', image: imageUrl },
      { name: 'Cleaning Appliances', image: imageUrl },
    ],
  },
  {
    name: 'Fashion',
    image: 'https://markettollbucket.s3.amazonaws.com/categories/fashion/6bb35a83-2304-4782-8851-0894bb3bb536',
    subCategories: [
      { name: "Men's Clothing", image: imageUrl },
      { name: "Women's Clothing", image: imageUrl },
      { name: "Kid's Clothing", image: imageUrl },
      { name: 'Footwear', image: imageUrl },
      { name: 'Accessories', image: imageUrl },
      { name: 'Jewelry', image: imageUrl },
      { name: 'Bags', image: imageUrl },
    ],
  },
  {
    name: 'Beauty & Personal Care',
    image: imageUrl,
    subCategories: [
      { name: 'Skincare', image: imageUrl },
      { name: 'Haircare', image: imageUrl },
      { name: 'Makeup', image: imageUrl },
      { name: 'Fragrances', image: imageUrl },
      { name: 'Personal Care Appliances', image: imageUrl },
    ],
  },
  {
    name: 'Health & Wellness',
    image: imageUrl,
    subCategories: [
      { name: 'Vitamins & Supplements', image: imageUrl },
      { name: 'Fitness Equipment', image: imageUrl },
      { name: 'Medical Supplies', image: imageUrl },
      { name: 'Personal Care', image: imageUrl },
    ],
  },
  {
    name: 'Sports & Outdoors',
    image: imageUrl,
    subCategories: [
      { name: 'Sports Equipment', image: imageUrl },
      { name: 'Outdoor Gear', image: imageUrl },
      { name: 'Fitness & Exercise', image: imageUrl },
      { name: 'Team Sports', image: imageUrl },
    ],
  },
  {
    name: 'Automotive',
    image: imageUrl,
    subCategories: [
      { name: 'Car Accessories', image: imageUrl },
      { name: 'Motorcycle Accessories', image: imageUrl },
      { name: 'Car Care', image: imageUrl },
      { name: 'Tools & Equipment', image: imageUrl },
    ],
  },
  {
    name: 'Books & Media',
    image: imageUrl,
    subCategories: [
      { name: 'Books', image: imageUrl },
      { name: 'Magazines', image: imageUrl },
      { name: 'Music', image: imageUrl },
      { name: 'Movies & TV Shows', image: imageUrl },
    ],
  },
  {
    name: 'Toys & Games',
    image: imageUrl,
    subCategories: [
      { name: 'Action Figures', image: imageUrl },
      { name: 'Educational Toys', image: imageUrl },
      { name: 'Board Games', image: imageUrl },
      { name: 'Video Games', image: imageUrl },
      { name: 'Outdoor Play', image: imageUrl },
    ],
  },
  {
    name: 'Home & Furniture',
    image: imageUrl,
    subCategories: [
      { name: 'Furniture', image: imageUrl },
      { name: 'Home Decor', image: imageUrl },
      { name: 'Bedding', image: imageUrl },
      { name: 'Kitchen & Dining', image: imageUrl },
      { name: 'Storage & Organization', image: imageUrl },
      { name: 'Lighting', image: imageUrl },
    ],
  },
  {
    name: 'Groceries',
    image: imageUrl,
    subCategories: [
      { name: 'Fresh Produce', image: imageUrl },
      { name: 'Beverages', image: imageUrl },
      { name: 'Snacks', image: imageUrl },
      { name: 'Pantry Staples', image: imageUrl },
      { name: 'Dairy Products', image: imageUrl },
      { name: 'Meat & Seafood', image: imageUrl },
    ],
  },
  {
    name: 'Pet Supplies',
    image: imageUrl,
    subCategories: [
      { name: 'Pet Food', image: imageUrl },
      { name: 'Pet Toys', image: imageUrl },
      { name: 'Pet Grooming', image: imageUrl },
      { name: 'Pet Health', image: imageUrl },
    ],
  },
  {
    name: 'Services',
    image: imageUrl,
    subCategories: [
      { name: 'Home Services', image: imageUrl },
      { name: 'Personal Services', image: imageUrl },
      { name: 'Business Services', image: imageUrl },
      { name: 'Repair Services', image: imageUrl },
    ],
  },
  {
    name: 'Miscellaneous',
    image: imageUrl,
    subCategories: [
      { name: 'Gifts', image: imageUrl },
      { name: 'Office Supplies', image: imageUrl },
      { name: 'Party Supplies', image: imageUrl },
      { name: 'Art & Craft Supplies', image: imageUrl },
    ],
  },
];

const populateProductCategoryModel = async () => {
  try {
    await productCategoryModel.insertMany(categories);
  } catch (error) {
    console.error('Error populating categories and subcategories:', error);
  }
};

export default populateProductCategoryModel;
