# 🎯 OpportunityRadar

**Never miss an opportunity again.**

**[📺 Watch the Demo Video Here!](https://drive.google.com/file/d/1f8rlgvd_ZydxAjpIikmZfrX3z2fjbO6H/view?usp=drivesdk)**

OpportunityRadar is a hyper-personalized, AI-powered career discovery platform built for the **Agents League Hackathon: Creative Apps Track**. It autonomously scours the internet for hackathons, scholarships, internships, and jobs, and then uses AI to match you with the opportunities you are most likely to win based on your unique skills and interests.

---

## ✨ Features
- **🤖 Autonomous Collection Agents**: 5 separate background agents continuously scrape and aggregate live opportunities from Devpost, Hacker News, RemoteOK, and Codeforces.
- **🧠 AI-Powered Matching**: Uses LLMs to calculate a deep "Fit Score" for every opportunity by analyzing skill gaps, interest alignment, and experience.
- **🗺️ Personalized Career Roadmap**: Generates a custom 3/6/12-month career progression plan based on the opportunities you match with.
- **🎨 Stunning UI/UX**: Built with a sleek, glassmorphism dark-mode interface using Next.js and Tailwind CSS.

---

## 🛠️ Microsoft IQ Integration: Work IQ
*This project fulfills the Microsoft IQ Integration requirement by deeply integrating with **Work IQ**.*

Instead of forcing users to manually type out their resumes, OpportunityRadar leverages Microsoft Work IQ to automatically build the user's career profile. 
- During onboarding, the backend (`workiqService.ts`) connects to the Work IQ intelligence layer.
- It reasons over the user's **Microsoft 365 grounded context** (Outlook emails, calendar events, OneDrive documents like project reports, and Teams chats).
- Work IQ securely extracts the user's technical stack, soft skills, career interests, and a professional summary.
- This creates a completely frictionless onboarding experience while eliminating hallucination by grounding the profile in real workplace data.

---

## 💻 GitHub Copilot Usage
*This project was rapidly prototyped and built using AI-assisted development with **GitHub Copilot** and **Copilot Chat**.*

**How Copilot assisted the creative process:**
1. **Agent Architecture**: Copilot was instrumental in designing the autonomous collector agents. By prompting Copilot with *"Create a Node.js background agent that fetches RSS feeds and maps them to a PostgreSQL schema"*, we rapidly scaffolded the entire data-ingestion pipeline.
2. **UI Prototyping (Agent Mode)**: We used Copilot to generate the complex glassmorphism CSS classes and layout structures in React. When we needed a multi-step onboarding flow, Copilot Chat generated the state-management logic and form validation instantly.
3. **Debugging & Refactoring (Edit Mode)**: Copilot Inline Chat was heavily used to refactor our API routes to correctly handle PostgreSQL transactions and fix Docker `node_modules` volume mapping issues.
4. **AI Matching Algorithm**: Copilot suggested the JSON schema structure for the `gpt-3.5-turbo` matching prompt, ensuring the LLM returned structured, parsable match scores consistently.

---

## 🚀 Setup & Installation (Docker)

The fastest way to run OpportunityRadar is using Docker Compose.

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/opportunityradar.git
   cd opportunityradar
   ```

2. **Set up Environment Variables**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   FRONTEND_URL=http://localhost:4000
   DB_HOST=postgres
   DB_PORT=5432
   DB_NAME=opportunityradar
   DB_USER=postgres
   DB_PASSWORD=postgres
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_secret
   JWT_SECRET=super_secret_jwt_key
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the App**
   - Frontend: [http://localhost:4000](http://localhost:4000)
   - Backend API: `http://localhost:5000`

---

## 🏗️ Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS, React Query
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Redis
- **AI**: OpenAI GPT-3.5-turbo, Microsoft Work IQ
- **Infrastructure**: Docker, Docker Compose
