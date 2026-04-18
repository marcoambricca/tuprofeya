const { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/s3');
const { v4: uuidv4 } = require('uuid');

const BUCKET = process.env.S3_BUCKET_NAME;

const uploadFile = async (buffer, originalName, mimeType, folder = 'uploads') => {
  const ext = originalName.split('.').pop();
  const key = `${folder}/${uuidv4()}.${ext}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));

  return {
    key,
    url: `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
};

const deleteFile = async (key) => {
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

const getPresignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn });
};

const uploadAvatar = (buffer, originalName, mimeType) =>
  uploadFile(buffer, originalName, mimeType, 'avatars');

const uploadCertificate = (buffer, originalName, mimeType) =>
  uploadFile(buffer, originalName, mimeType, 'certificates');

module.exports = { uploadFile, deleteFile, getPresignedUrl, uploadAvatar, uploadCertificate };
