const express = require('express');
const router = express.Router();
const { analyzeCode } = require('../controllers/aiController');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Test endpoint to verify API key
router.get('/test', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        res.json({ success: true, message: "API key works!", response: response.text() });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/analyze', analyzeCode);

module.exports = router;