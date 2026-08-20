const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/blend-images', upload.fields([{ name: 'photo1' }, { name: 'photo2' }]), async (req, res) => {
    try {
        const file1 = req.files && req.files['photo1'] ? req.files['photo1'][0].buffer : null;
        const file2 = req.files && req.files['photo2'] ? req.files['photo2'][0].buffer : null;

        if (!file1) {
            return res.status(400).json({ error: 'At least one photo is required.' });
        }

        const width = 1080;
        const height = 1080;
        let compositeLayers = [];

        if (file1 && file2) {
            const img1 = await sharp(file1).resize(width / 2, height, { fit: 'cover' }).toBuffer();
            const img2 = await sharp(file2).resize(width / 2, height, { fit: 'cover' }).toBuffer();
            compositeLayers = [
                { input: img1, top: 0, left: 0 },
                { input: img2, top: 0, left: width / 2 }
            ];
        } else {
            const singleImg = await sharp(file1).resize(width, height, { fit: 'cover' }).toBuffer();
            compositeLayers = [{ input: singleImg, top: 0, left: 0 }];
        }

        const finalImageBuffer = await sharp({
            create: { width, height, channels: 4, background: { r: 10, g: 10, b: 10, alpha: 1 } }
        })
        .composite(compositeLayers)
        .png()
        .toBuffer();

        res.setHeader('Content-Type', 'image/png');
        res.status(200).send(finalImageBuffer);
    } catch (error) {
        res.status(500).json({ error: 'Image processing failed on server.' });
    }
});

module.exports = app;
