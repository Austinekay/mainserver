const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (file, folder = 'shop-images') => {
  try {
    console.log('S3 Upload - File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.buffer?.length
    });
    
    const fileExtension = path.extname(file.originalname);
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
    
    console.log('S3 Upload - Generated filename:', fileName);
    console.log('S3 Upload - Bucket:', process.env.AWS_S3_BUCKET);
    console.log('S3 Upload - Region:', process.env.AWS_REGION);

    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    console.log('S3 Upload - Sending to S3...');
    const result = await s3Client.send(new PutObjectCommand(uploadParams));
    console.log('S3 Upload - Success:', result);
    
    const url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    console.log('S3 Upload - Generated URL:', url);
    return url;
  } catch (error) {
    console.error('S3 Upload - Error details:', {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      stack: error.stack
    });
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

module.exports = { uploadToS3 };