import express from "express";
import ffmpeg from "fluent-ffmpeg";

const app = express();
app.use(express.json());

app.post('/process-video', (req, res) => {
    //   GET THE VIDEO FILE PATH FROM THE REQUEST
    const inputFilePath = req.body.inputFilePath;
    const outputFilePath = req.body.outputFilePath;

    if (!inputFilePath || !outputFilePath) {
        res.status(400).send(
            'BAD REQUEST: MISSING FILE PATH FOR ' + inputFilePath === undefined ? 'INPUT' : 'OUTPUT'
        );
    }

    ffmpeg(inputFilePath)
        .outputOptions("-vf", "scale=-1:360") // 360P RESOLUTION
        .on("end", () => {
            console.log("VIDEO PROCESSING COMPLETED");
            res.status(200).send("VIDEO PROCESSING COMPLETED");
        })
        .on("error", (err) => {
            console.log(`AN ERROR OCCURRED: ${err.message}`)
            res.status(500).send(`INTERNAL SERVER ERROR: ${err.message}`);
        })
        .save(outputFilePath)
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(
        'video-processing-service listening at http://localhost:' + port
    );
});