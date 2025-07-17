import axios from 'axios';
import fs from 'fs/promises';
import { RekognitionClient, DetectModerationLabelsCommand } from '@aws-sdk/client-rekognition';

// Initialize AWS Rekognition client
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// AWS Rekognition API helper for image moderation
export async function analyzeImageWithAWSRekognition(imageBuffer) {
  console.log("imageBuffer", Buffer.from(imageBuffer));
  try {
    const command = new DetectModerationLabelsCommand({
      Image: {
        Bytes: imageBuffer,
      },
      MinConfidence: 50, // Minimum confidence threshold
    });
    const response = await rekognitionClient.send(command);
    const moderationLabels = response.ModerationLabels || [];
    console.log("response", response.ModerationLabels);

    // Check for strong inappropriate content
    let status = 'approved';
    let reason = '';
    for (const label of moderationLabels) {
      const confidence = label.Confidence || 0;
      const name = label.Name || '';

      // Strong inappropriate: confidence > 80%
      if (confidence > 80) {
        status = 'rejected';
        reason = reason + `${name}${' '}`;
        break;
      }
      // Pending review: confidence > 50%
      else if (confidence > 50 && status !== 'rejected') {
        status = 'pending_review';
        reason = reason + `${name}${' '}`;
      }
    }

    return { status, reason };
  } catch (error) {
    return nextError(next, 500, 'Please upload a product/service image that meets our content guidelines.');
  }
}

// OpenAI Moderation API helper
export async function moderateTextWithOpenAI(text, openaiApiKey) {
  const url = 'https://api.openai.com/v1/moderations';
  const response = await axios.post(
    url,
    { input: text },
    { headers: { Authorization: `Bearer ${openaiApiKey}` } }
  );
  const result = response.data.results[0];
  // OpenAI returns categories (bool) and category_scores (float 0-1)
  let status = 'approved';
  let flagged = false;
  for (const [cat, flaggedBool] of Object.entries(result.categories)) {
    if (flaggedBool) {
      const score = result.category_scores[cat];
      if (score > 0.7) {
        status = 'rejected';
        flagged = true;
        break;
      } else if (score > 0.3 && status !== 'rejected') {
        status = 'pending_review';
        flagged = true;
      }
    }
  }
  return { status, categories: result.categories, flagged };
}

// async function removeBgWithRemBG(buffer) {
//   const formData = new FormData();
//   formData.append('image_file', new Blob([buffer]), 'image.png');

//   const res = await fetch('http://localhost:5000', {
//     method: 'POST',
//     body: formData,
//   });

//   return await res.arrayBuffer(); // returns cleaned image buffer
// }