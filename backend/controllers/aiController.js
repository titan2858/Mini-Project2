const axios = require('axios');

const analyzeCode = async (req, res) => {
    const { sourceCode, problemTitle, language } = req.body;

    console.log("🤖 AI Analysis Request:", { problemTitle, language, codeLength: sourceCode?.length });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ AI Error: GEMINI_API_KEY is missing");
        return res.status(500).json({ message: "Server API Key configuration error" });
    }

    try {
        const prompt = `
            You are a coding interview coach. 
            Analyze this ${language} solution for "${problemTitle}".
            
            Code:
            ${sourceCode}

            Return purely valid JSON with these keys:
            {
                "timeComplexity": "O(...)",
                "spaceComplexity": "O(...)",
                "feedback": "Short summary...",
                "suggestions": ["Tip 1", "Tip 2"]
            }
            Do not use markdown formatting. Just raw JSON.
        `;

        // Use models that are actually available from the API
        const models = [
            "gemini-2.5-flash",      // Newest and fastest
            "gemini-2.0-flash",      // Fallback
            "gemini-2.5-flash-lite"  // Lighter fallback
        ];

        let response = null;
        let successModel = null;

        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
                console.log(`📡 Trying model: ${model}`);
                
                response = await axios.post(url, {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 second timeout
                });

                successModel = model;
                console.log(`✅ Success with model: ${model}`);
                break;
            } catch (err) {
                console.log(`❌ Model ${model} failed: ${err.response?.status} - ${err.response?.data?.error?.message || err.message}`);
            }
        }

        if (!response) {
            throw new Error("All models failed. Please check your API key or try again later.");
        }

        // Parse the response
        const text = response.data.candidates[0].content.parts[0].text;
        console.log("✅ Raw AI Response:", text.substring(0, 200));
        
        // Clean up the response - remove markdown code blocks if present
        let cleanText = text.trim();
        cleanText = cleanText.replace(/```json\n?/g, '');
        cleanText = cleanText.replace(/```\n?/g, '');
        cleanText = cleanText.trim();
        
        const parsed = JSON.parse(cleanText);
        console.log("✅ Analysis successful");
        res.json(parsed);

    } catch (error) {
        console.error("❌ AI Generation Error:", error.message);
        if (error.response?.data) {
            console.error("API Error:", JSON.stringify(error.response.data, null, 2));
        }
        res.status(500).json({ 
            message: "Failed to analyze code", 
            error: error.message
        });
    }
};

module.exports = { analyzeCode };