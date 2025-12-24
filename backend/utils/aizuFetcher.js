const axios = require('axios');
const cheerio = require('cheerio');

// Verified List of ITP1 (Intro to Programming) problems
const PROBLEM_IDS = [
    'ITP1_1_B', 'ITP1_1_C', 'ITP1_1_D', 
    'ITP1_2_A', 'ITP1_2_C', 'ITP1_2_D',
    'ITP1_3_A', 'ITP1_3_B', 'ITP1_3_C', 'ITP1_3_D',
    'ITP1_4_A', 'ITP1_4_B', 'ITP1_4_C', 'ITP1_4_D'
];

const getAizuProblem = async () => {
    try {
        const randomId = PROBLEM_IDS[Math.floor(Math.random() * PROBLEM_IDS.length)];
        const apiUrl = `https://judgeapi.u-aizu.ac.jp/resources/descriptions/en/${randomId}`;
        
        console.log(`[AIZU] Fetching: ${apiUrl}`);
        
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
            },
            timeout: 5000 
        });

        let data = response.data;

        // Handle String Response
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error(`[AIZU] Failed to parse response string: ${data.substring(0, 50)}...`);
                return null;
            }
        }

        // Check for 'html' key as well
        let htmlContent = data.html_description || data.html;

        // Fallback: Sometimes only literal_description exists
        if (!htmlContent && data.literal_description) {
            console.log('[AIZU] html/html_description missing, using literal_description');
            htmlContent = `<pre>${data.literal_description}</pre>`;
        }

        // Check if we found ANY content
        if (!htmlContent) {
            console.error(`[AIZU] Error: Missing description fields.`);
            if (data) {
                console.log(`[AIZU] Received Keys: ${Object.keys(data).join(', ')}`);
            }
            return null;
        }

        if (typeof htmlContent !== 'string') {
            console.error(`[AIZU] Error: Description content is not a string. Type: ${typeof htmlContent}`);
            return null;
        }

        // Parse HTML
        const $ = cheerio.load(htmlContent);

        // --- EXTRACT REAL TITLE ---
        // Try to find the h1 tag which usually contains the title
        let realTitle = $('h1').first().text().trim();
        
        // If no h1, fallback to h2
        if (!realTitle) {
            realTitle = $('h2').first().text().trim();
        }

        // Cleanup: Remove the title from the description HTML so it doesn't show twice
        $('h1').remove();
        
        // Cleanup other elements
        $('script').remove();
        $('img').remove();

        const displayTitle = realTitle || `Aizu ${randomId}`;

        const testCases = [];
        let currentInput = null;

        // Robust parsing for Aizu format (Headers followed by PRE tags)
        $('h2, h3, p, div').each((i, el) => {
            const text = $(el).text().toLowerCase();
            
            if (text.includes('sample input')) {
                const nextEl = $(el).next();
                if (nextEl.is('pre')) {
                    currentInput = nextEl.text().trim();
                }
            } else if (text.includes('sample output') && currentInput !== null) {
                const nextEl = $(el).next();
                if (nextEl.is('pre')) {
                    const output = nextEl.text().trim();
                    testCases.push({ input: currentInput, expectedOutput: output });
                    currentInput = null;
                }
            }
        });

        if (testCases.length === 0) {
            console.warn(`[AIZU] Warning: No test cases extracted for ${randomId}.`);
        }

        const starterCode = {
            javascript: `// Solve ${displayTitle}\nconst fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin').toString().trim().split('\\n');\n// Write code here\n`,
            python: `# Solve ${displayTitle}\nimport sys\nlines = sys.stdin.readlines()\n# Write code here\n`,
            cpp: `// Solve ${displayTitle}\n#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}`,
            java: `// Solve ${displayTitle}\nimport java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}`
        };

        return {
            problemId: randomId,
            title: displayTitle, 
            description: $.html(), // Return modified HTML (without H1)
            descriptionUrl: `https://onlinejudge.u-aizu.ac.jp/problems/${randomId}`,
            testCases: testCases,
            starterCode: starterCode
        };

    } catch (error) {
        console.error("Aizu Fetch Error:", error.message);
        return null;
    }
};

module.exports = { getAizuProblem };