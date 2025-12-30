⚔️ AlgoBattle - Real-Time 1v1 Coding Competition Platform

AlgoBattle is a competitive coding platform where developers compete against each other in real-time. It simulates the high-pressure environment of technical interviews with live 1v1 coding battles, integrated compilation, and AI-powered performance analysis.

🚀 Key Features

🎮 Real-Time Multiplayer

Instant Matchmaking: Create or join battle rooms via unique Room IDs.

Live Sync: Game state, player connection status, and progress bars are synchronized in real-time using Socket.io.

1-Minute Prep Timer: A dedicated countdown ensures both players are ready before the problem is revealed.

💻 Advanced Coding Arena

Monaco Editor: Integrated VS Code-like editor with syntax highlighting for JavaScript, Python, C++, and Java.

Live Compilation: Execute code against sample test cases using the JDoodle API.

Dynamic Problem Fetching: Problems are fetched in real-time from the Aizu Online Judge API, ensuring a limitless pool of questions.

Hidden Test Cases: Submissions are validated against hidden test cases to determine the true winner.

🤖 AI Coach (Powered by Gemini)

Post-Match Analysis: After the battle, the Google Gemini AI analyzes your code.

Smart Feedback: Get detailed insights on Time Complexity, Space Complexity, and specific suggestions to optimize your solution.

🛡️ Anti-Cheat System

Tab Switching Detection: The platform monitors page visibility. If a user switches tabs (e.g., to Google answers), they receive a strike.

3-Strike Disqualification: Upon the 3rd strike, the player is automatically disqualified, and the opponent wins.

🏆 Ranking & Profiles

Dynamic Ranks: Climb the ladder from Novice to Grandmaster based on your win count.

Match History: Track your past battles, wins, losses, and opponents.

🛠️ Tech Stack

Frontend

React.js (Vite): Fast, component-based UI.

Tailwind CSS: Modern, responsive styling.

Monaco Editor: The code editor engine that powers VS Code.

Lucide React: Beautiful, consistent iconography.

Socket.io-client: Real-time bi-directional communication.

Backend

Node.js & Express.js: RESTful API and server logic.

MongoDB & Mongoose: NoSQL database for storing users, matches, and history.

Socket.io: Handling WebSocket connections for rooms and game state.

Cheerio: For scraping/parsing problem data from external judges.

External APIs

Google Gemini API: For AI code analysis.

JDoodle API: For remote code compilation and execution.

Aizu Online Judge API: For fetching algorithmic problems.

⚙️ Local Setup & Installation

Follow these steps to run the project locally.

1. Clone the Repository

git clone [https://github.com/titan2858/Clash-Of-Coders.git](https://github.com/titan2858/Clash-Of-Coders.git)
cd Clash-Of-Coders


2. Backend Setup

Navigate to the backend folder, install dependencies, and configure environment variables.

cd backend
npm install


Create a .env file in the backend directory:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# JDoodle Compiler Credentials ([https://www.jdoodle.com/compiler-api/](https://www.jdoodle.com/compiler-api/))
JDOODLE_CLIENT_ID=your_jdoodle_client_id
JDOODLE_CLIENT_SECRET=your_jdoodle_client_secret

# Google Gemini AI Key ([https://aistudio.google.com/](https://aistudio.google.com/))
GEMINI_API_KEY=your_gemini_api_key


Start the Backend Server:

npm start


The server will run on http://localhost:5000

3. Frontend Setup

Open a new terminal, navigate to the frontend folder, and install dependencies.

cd frontend
npm install


Start the React Development Server:

npm run dev


The app will run on http://localhost:5173

📖 How It Works

Register/Login: Create an account to track your Elo and stats.

Dashboard: Click "Create Battle Room" to get a Room ID.

Invite: Share the Room ID with a friend.

Lobby: Once both players join, a 60-second countdown begins.

Battle: * Read the problem description.

Write your code in your preferred language.

Use "Run" to test against public cases.

Click "Submit" to validate against hidden cases.

Victory: The first player to pass all hidden test cases wins!

Review: Use the "Analyze My Code" button to get AI feedback on your solution.

🤝 Contributing

Contributions are always welcome!

Fork the repository.

Create a new branch (git checkout -b feature/AmazingFeature).

Commit your changes (git commit -m 'Add some AmazingFeature').

Push to the branch (git push origin feature/AmazingFeature).

Open a Pull Request.

📄 License

This project is licensed under the MIT License.

Author

Built with ❤️ by Hrishikesh Bankapur