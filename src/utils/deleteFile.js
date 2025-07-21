import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const deleteFile = async (path) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: path,
  };

  const command = new DeleteObjectCommand(params);
  await s3Client.send(command);
};

export default deleteFile;
