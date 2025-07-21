import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const saveFile = async (path, file) => {
  const { buffer, mimetype } = file;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${process.env.NODE_ENV}/${path}`,
    Body: buffer,
    ContentType: mimetype,
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  return `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;
};

export default saveFile;
