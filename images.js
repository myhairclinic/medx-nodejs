const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// 🔥 Render Port Fix
const PORT = process.env.PORT || 3001;

// JSON ve form parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// images klasörü oluştur
const imagesDir = path.join(__dirname, './clinic-images');

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Statik dosya servis
app.use('/clinic-images', express.static(imagesDir));

// 🔥 Upload API
app.post('/api/upload-image', (req, res) => {
    try {
        const { patientId, type, imageData } = req.body;

        if (!patientId || !type || !imageData) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // eski resmi sil
        const files = fs.readdirSync(imagesDir);
        const oldFile = files.find(f => f.startsWith(`${patientId}_${type}`));
        if (oldFile) {
            fs.unlinkSync(path.join(imagesDir, oldFile));
        }

        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const fileName = `${patientId}_${type}_${Date.now()}.jpg`;
        const filePath = path.join(imagesDir, fileName);

        fs.writeFileSync(filePath, buffer);

        res.json({
            success: true,
            fileName,
            path: `/clinic-images/${fileName}`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// 🔥 Get images
app.get('/api/get-images/:patientId', (req, res) => {
    try {
        const { patientId } = req.params;
        const files = fs.readdirSync(imagesDir);

        const before = files.find(f => f.startsWith(`${patientId}_before`));
        const after = files.find(f => f.startsWith(`${patientId}_after`));

        res.json({
            before: before ? `/clinic-images/${before}` : null,
            after: after ? `/clinic-images/${after}` : null
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

// 🔥 Delete image
app.delete('/api/delete-image/:fileName', (req, res) => {
    try {
        const filePath = path.join(imagesDir, req.params.fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Delete failed' });
    }
});

// 🔥 Start server (important for Render)
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
