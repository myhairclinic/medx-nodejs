const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// 🔥 Railway PORT
const PORT = process.env.PORT || 3001;

// CORS (Production için doğru)
app.use(cors({
    origin: "*",
    methods: "GET,POST,PUT,DELETE",
}));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// images klasörü
const imagesDir = path.join(__dirname, 'clinic-images');

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// 🔥 Statik dosya servisi
app.use('/clinic-images', express.static(imagesDir));


// ======================================================
// 🔥 IMAGE UPLOAD
// ======================================================
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

        // base64 → buffer
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        const fileName = `${patientId}_${type}_${Date.now()}.jpg`;
        const filePath = path.join(imagesDir, fileName);

        fs.writeFileSync(filePath, buffer);

        return res.json({
            success: true,
            fileName,
            path: `/clinic-images/${fileName}`
        });

    } catch (err) {
        console.error("UPLOAD ERROR:", err);
        return res.status(500).json({ error: 'Upload failed' });
    }
});


// ======================================================
// 🔥 GET IMAGES
// ======================================================
app.get('/api/get-images/:patientId', (req, res) => {
    try {
        const { patientId } = req.params;
        const files = fs.readdirSync(imagesDir);

        const before = files.find(f => f.startsWith(`${patientId}_before`));
        const after = files.find(f => f.startsWith(`${patientId}_after`));

        return res.json({
            before: before ? `/clinic-images/${before}` : null,
            after: after ? `/clinic-images/${after}` : null
        });

    } catch (err) {
        console.error("GET IMAGES ERROR:", err);
        return res.status(500).json({ error: 'Failed to fetch images' });
    }
});


// ======================================================
// 🔥 DELETE IMAGE
// ======================================================
app.delete('/api/delete-image/:fileName', (req, res) => {
    try {
        const filePath = path.join(imagesDir, req.params.fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return res.json({ success: true });
        } else {
            return res.status(404).json({ error: 'Not found' });
        }

    } catch (err) {
        console.error("DELETE ERROR:", err);
        return res.status(500).json({ error: 'Delete failed' });
    }
});


// ======================================================
// 🔥 START SERVER
// ======================================================
app.listen(PORT, () => {
    console.log(`🔥 Server running on port ${PORT}`);
});
