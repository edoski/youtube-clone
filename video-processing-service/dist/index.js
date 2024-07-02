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
const express_1 = __importDefault(require("express"));
const storage_1 = require("./storage");
(0, storage_1.setupDirectories)();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post('/process-video', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //     GET BUCKET AND FILE NAME FROM THE CLOUD PUB/SUB MESSAGE
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf-8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('INVALID MESSAGE PAYLOAD RECEIVED');
        }
    }
    catch (err) {
        console.log(err);
        res.status(400).send('BAD REQUEST: MISSING FILE NAME');
    }
    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;
    //     DOWNLOAD VIDEO FROM CLOUD STORAGE
    yield (0, storage_1.downloadRawVideo)(inputFileName);
    //     CONVERT VIDEO TO 720P RESOLUTION
    try {
        yield (0, storage_1.convertVideo)(inputFileName, outputFileName);
    }
    catch (err) {
        yield Promise.all([
            (0, storage_1.deleteRawVideo)(inputFileName),
            (0, storage_1.deleteProcessedVideo)(outputFileName)
        ]);
        console.log(err);
        return res.status(500).send('INTERNAL SERVER ERROR: VIDEO PROCESSING FAILED');
    }
    //     UPLOAD PROCESSED VIDEO TO CLOUD STORAGE
    yield (0, storage_1.uploadProcessedVideo)(outputFileName);
    yield Promise.all([
        (0, storage_1.deleteRawVideo)(inputFileName),
        (0, storage_1.deleteProcessedVideo)(outputFileName)
    ]);
    res.status(200).send('VIDEO PROCESSING COMPLETED');
}));
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('video-processing-service listening at http://localhost:' + port);
});
