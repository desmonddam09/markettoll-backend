import { analyzeImageWithAWSRekognition, moderateTextWithOpenAI } from '../helpers/moderationHelpers.js';
import { nextError } from '../utils/index.js';
import fs from 'fs/promises';

// OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Middleware to moderate content (text and images) for product/service creation.
 * Expects req.body.description and req.files.images (array of images from multer).
 * Frontend sends images as "images" field in FormData.
 */
export default async function moderateContent(req, res, next) {

  try {
    const description = req.body.description || '';
    const name = req.body.name || '';
    const pickupAddress = req.body.pickupAddress || '';
    // Get images from req.files.images (multer field name)
    const images = req.files?.filter(t => t.fieldname === 'images');
    let allExtractedText = `${description} ${name}`.trim();

    let moderationStatus = 'approved';
    let moderationReason = '';

    for (const img of images) {

      const buffer = img.buffer || (img.path ? await fs.readFile(img.path) : null);
      if (!buffer) continue;

      // cleanBuffer = await removeBgWithRemBG(imageBuffer);
      // // SafeSearch
      const { status: imageStatus, reason } = await analyzeImageWithAWSRekognition(buffer);
      moderationStatus = imageStatus;
      moderationReason = reason;
    }

    if (moderationStatus !== 'rejected' && allExtractedText.trim()) {
      const { status: textStatus } = await moderateTextWithOpenAI(allExtractedText, OPENAI_API_KEY);
      if (textStatus === 'rejected') {
        moderationStatus = 'rejected';
        moderationReason = 'Please update a product description that meets our content guidelines.';
      } else if (textStatus === 'pending_review' && moderationStatus !== 'rejected') {
        moderationStatus = 'pending_review';
        moderationReason = moderationReason + 'Image flaged: Inappropriate text';
      }
    }

    req.moderationStatus = moderationStatus;
    req.moderationReason = moderationReason;
    console.log("#####################", moderationStatus, moderationReason);
    if (moderationStatus === 'rejected') {
      return nextError(next, 400, 'Please update product/service that meets our content guidelines.');
    }

    next();
  } catch (err) {
    console.error('Moderation error:', err);
    return nextError(next, 500, 'Please update product/service that meets our content guidelines.');
  }
} 