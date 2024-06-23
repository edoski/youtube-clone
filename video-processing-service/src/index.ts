import express from "express";
import {
    convertVideo,
    deleteProcessedVideo,
    deleteRawVideo,
    downloadRawVideo,
    setupDirectories,
    uploadProcessedVideo
} from "./storage";

setupDirectories();

const app = express();
app.use(express.json());

app.post('/process-video', async (req, res) => {
//     GET BUCKET AND FILE NAME FROM THE CLOUD PUB/SUB MESSAGE
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf-8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('INVALID MESSAGE PAYLOAD RECEIVED');
        }
    } catch (err) {
        console.log(err);
        res.status(400).send('BAD REQUEST: MISSING FILE NAME');
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

//     DOWNLOAD VIDEO FROM CLOUD STORAGE
    await downloadRawVideo(inputFileName);

//     CONVERT VIDEO TO 720P RESOLUTION
    try {
        await convertVideo(inputFileName, outputFileName);
    } catch (err) {
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);
        console.log(err);
        return res.status(500).send('INTERNAL SERVER ERROR: VIDEO PROCESSING FAILED');
    }

//     UPLOAD PROCESSED VIDEO TO CLOUD STORAGE
    await uploadProcessedVideo(outputFileName);

    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ])

    res.status(200).send('VIDEO PROCESSING COMPLETED');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(
        'video-processing-service listening at http://localhost:' + port
    );
});