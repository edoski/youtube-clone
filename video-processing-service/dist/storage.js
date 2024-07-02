"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDirectories = setupDirectories;
exports.convertVideo = convertVideo;
exports.downloadRawVideo = downloadRawVideo;
exports.uploadProcessedVideo = uploadProcessedVideo;
exports.deleteRawVideo = deleteRawVideo;
exports.deleteProcessedVideo = deleteProcessedVideo;
const storage_1 = require("@google-cloud/storage");
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const storage = new storage_1.Storage();
const rawVideoBucketName = "edo-mograph-raw-videos";
const processedVideoBucketName = "edo-mograph-processed-videos";
const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";
/*
 * CREATES THE LOCAL DIRECTORIES FOR RAW AND PROCESSED VIDEOS
 */
function setupDirectories() {
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}
/*
 * @param rawVideoName: THE NAME OF THE FILE TO CONVERT FROM {@link localRawVideoPath}
 * @param processedVideoName: THE NAME OF THE FILE TO CONVERT TO {@link localProcessedVideoPath}
 * @returns A PROMISE THAT RESOLVES WHEN THE VIDEO CONVERSION IS COMPLETED
 */
function convertVideo(rawVideoName, processedVideoName) {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(`${localRawVideoPath}/${rawVideoName}`)
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
    });
}
/*
 * @param fileName: THE NAME OF THE FILE TO UPLOAD TO THE RAW VIDEO BUCKET
 * {@link rawVideoBucketName}INTO THE RAW VIDEO FOLDER {@link localRawVideoPath}
 * @returns A PROMISE THAT RESOLVES WHEN THE FILE IS DOWNLOADED
 */
function downloadRawVideo(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        yield storage.bucket(rawVideoBucketName)
            .file(fileName)
            .download({ destination: `${localRawVideoPath}/${fileName}` });
        console.log(`gs://${rawVideoBucketName}/${fileName} DOWNLOADED TO ${localRawVideoPath}/${fileName}`);
    });
}
/*
 * @param fileName: THE NAME OF THE FILE TO UPLOAD TO THE PROCESSED VIDEO BUCKET
 * {@link processedVideoBucketName} FROM THE PROCESSED VIDEO FOLDER {@link localProcessedVideoPath}
 * @returns A PROMISE THAT RESOLVES WHEN THE FILE IS UPLOADED
 */
function uploadProcessedVideo(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const bucket = storage.bucket(processedVideoBucketName);
        yield bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
            destination: fileName
        });
        console.log(`${localProcessedVideoPath}/${fileName} UPLOADED TO gs://${processedVideoBucketName}/${fileName}`);
        yield bucket.file(fileName).makePublic();
    });
}
/*
 * @param fileName: THE NAME OF THE FILE TO DELETE FROM THE RAW VIDEO FORLDER {@link localRawVideoPath}
 * @returns A PROMISE THAT RESOLVES WHEN THE FILE IS DELETED
 */
function deleteRawVideo(fileName) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}
/*
 * @param fileName: THE NAME OF THE FILE TO DELETE FROM THE PROCESSED VIDEO FOLDER {@link localProcessedVideoPath}
 * @returns A PROMISE THAT RESOLVES WHEN THE FILE IS DELETED
 */
function deleteProcessedVideo(fileName) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}
/*
 * @param fileName: THE PATH OF THE FILE TO DELETE
 * @returns A PROMISE THAT RESOLVES WHEN THE FILE IS DELETED
 */
function deleteFile(filePath) {
    return new Promise((resolve, reject) => {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlink(filePath, (err) => {
                if (err) {
                    console.log(`INTERNAL SERVER ERROR: ${err.message}`);
                    reject(err);
                }
                else {
                    console.log(`FILE ${filePath} DELETED`);
                    resolve();
                }
            });
        }
        else {
            console.log(`FILE ${filePath} DOES NOT EXIST, SKIPPING DELETION`);
            resolve();
        }
    });
}
/*
 * ENSURES THE DIRECTORY EXISTS, CREATES THE DIRECTORY IF IT DOES NOT EXIST
 * @param dirPath: THE PATH OF THE DIRECTORY TO ENSURE EXISTS
 */
function ensureDirectoryExistence(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
        console.log(`DIRECTORY ${dirPath} CREATED`);
    }
}
