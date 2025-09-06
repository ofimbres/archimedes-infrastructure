const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const AdmZip = require("adm-zip");

dotenv.config();

// Load environment variables
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "dev-archimedes-exercises-bucket";
const REGION = process.env.AWS_REGION || "us-west-2";

// Initialize S3 Client
const s3Client = new S3Client({ region: REGION });

/**
 * Get the correct Content-Type based on file extension
 */
function getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".zip": "application/zip",
        ".pdf": "application/pdf",
    };
    return contentTypes[ext] || "application/octet-stream";
}

/**
 * Upload a file to S3
 */
async function uploadFileToS3(filePath, key, contentType) {
    try {
        const fileStream = fs.createReadStream(filePath);

        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileStream,
            ContentType: contentType,
        };

        const uploader = new Upload({
            client: s3Client,
            params: uploadParams,
        });

        await uploader.done();
        console.log(`✅ Uploaded: s3://${BUCKET_NAME}/${key} (${contentType})`);
    } catch (error) {
        console.error("❌ Upload failed:", error);
    }
}

/**
 * Extract and upload ZIP contents to S3
 */
async function extractAndUpload(zipFilePath) {
    try {
        const zip = new AdmZip(zipFilePath);
        const outputFolder = path.resolve(__dirname, "extracted"); // Temporary folder

        console.log("📦 Extracting ZIP file...");
        zip.extractAllTo(outputFolder, true);

        const zipEntries = zip.getEntries();

        for (const entry of zipEntries) {
            if (!entry.isDirectory) {
                const fileName = entry.entryName;
                const filePath = path.join(outputFolder, fileName);
                const s3Key = `${fileName}`;
                const contentType = getContentType(fileName);

                await uploadFileToS3(filePath, s3Key, contentType);
            }
        }

        console.log("🎉 All files extracted and uploaded!");
    } catch (error) {
        console.error("❌ Extraction failed:", error);
    }
}

/**
 * Upload ZIP and then extract contents
 */
async function processUpload(zipFileName) {
    const zipFilePath = path.resolve(__dirname, zipFileName);
    // const s3ZipKey = `miniquizz/${zipFileName}`;

    // Extract and upload files
    await extractAndUpload(zipFilePath);
}

// Example usage
const zipFileName = "../data/miniquizzes.zip";
processUpload(zipFileName).catch(console.error);
