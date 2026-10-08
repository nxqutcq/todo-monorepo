import "dotenv/config";

process.env.JWT_SECRET ??= "test_jwt_secret";
process.env.S3_USE_MEMORY ??= "1";
process.env.S3_BUCKET_NAME ??= "test-bucket";
process.env.AWS_REGION ??= "eu-north-1";
