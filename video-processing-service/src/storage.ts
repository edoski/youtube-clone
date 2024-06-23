import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from "fluent-ffmpeg";

const storage = new Storage();

const rawVideoBucketName = "edo-mograph-raw-videos";
const processedVideoBucketName = "edo-mograph-processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

/*
 * CREATES THE LOCAL DIRECTORIES FOR RAW AND PROCESSED VIDEOS
 */
export function setupDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

/*
 * @param rawVideoName: THE NAME OF THE FILE TO CONVERT FROM {@link localRawVideoPath}
 * @param processedVideoName: THE NAME OF THE FILE TO CONVERT TO {@link localProcessedVideoPath}
 * @returns A PROMISE THAT RESOLVES WHEN THE VIDEO CONVERSION IS COMPLETED
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
            .outputOptions("-vf", "scale=-1:720") // 720P RESOLUTION
            .on("end", () => {
                console.log("VIDEO PROCESSING COMPLETED");
                resolve();
            })
            .on("error", (err) => {
                console.log(`INTERNAL SERVER ERROR: ${err.message}`);
                reject(err);
            })
            .save(`${localProcessedVideoPath}/${processedVideoName}`);
    })
}

/*
 * @param fileName: THE NAME OF THE FILE TO UPLOAD TO THE RAW VIDEO BUCKET
 * {@link rawVideoBucketName}INTO THE RAW VIDEO FOLDER {@link localRawVideoPath}
 * @returns A PROMISE THAT RESOLVES WHEN THE FILE IS DOWNLOADED
 */
export async function downloadRawVideo(fileName: string) {
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({ destination: `${localRawVideoPath}/${fileName}` });

    console.log(
        `gs://${rawVideoBucketName}/${fileName} DOWNLOADED TO ${localRawVideoPath}/${fileName}`
    );
}

/*
 * @param fileName: THE NAME OF THE FILE TO UPLOAD TO THE PROCESSED VIDEO BUCKET
 * {@link processedVideoBucketName} FROM THE PROCESSED VIDEO FOLDER {@link localProcessedVideoPath}
 * @returns A PROMISE THAT RESOLVES WHEN THE FILE IS UPLOADED
 */
export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName);

    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName
    });

    console.log(
        `${localProcessedVideoPath}/${fileName} UPLOADED TO gs://${processedVideoBucketName}/${fileName}`
    );

    await bucket.file(fileName).makePublic();
}

/*
 * @param fileName: THE NAME OF THE FILE TO DELETE FROM THE RAW VIDEO FORLDER {@link localRawVideoPath}
 * @returns A PROMISE THAT RESOLVES WHEN THE FILE IS DELETED
 */
export function deleteRawVideo(fileName: string): Promise<void> {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

/*
 * @param fileName: THE NAME OF THE FILE TO DELETE FROM THE PROCESSED VIDEO FOLDER {@link localProcessedVideoPath}
 * @returns A PROMISE THAT RESOLVES WHEN THE FILE IS DELETED
 */
export function deleteProcessedVideo(fileName: string): Promise<void> {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

/*
 * @param fileName: THE PATH OF THE FILE TO DELETE
 * @returns A PROMISE THAT RESOLVES WHEN THE FILE IS DELETED
 */
function deleteFile(filePath: string): Promise<void> {
    return new Promise<void> ((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`INTERNAL SERVER ERROR: ${err.message}`);
                    reject(err);
                } else {
                    console.log(`FILE ${filePath} DELETED`);
                    resolve();
                }
            });
        } else {
            console.log(`FILE ${filePath} DOES NOT EXIST, SKIPPING DELETION`);
            resolve();
        }
    });
}

/*
 * ENSURES THE DIRECTORY EXISTS, CREATES THE DIRECTORY IF IT DOES NOT EXIST
 * @param dirPath: THE PATH OF THE DIRECTORY TO ENSURE EXISTS
 */
function ensureDirectoryExistence(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`DIRECTORY ${dirPath} CREATED`)
    }
}