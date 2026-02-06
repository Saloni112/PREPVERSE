Backend – Express + MongoDB
--------------------------------
Commands:
1) Copy .env or set MONGO_URI and PORT (defaults: mongodb://127.0.0.1:27017/WorkWaveDB, 5000)
2) Install: npm install
3a) Seed sample data: npm run seed
3b) Start server:   npm run dev    (or npm start)

Key routes:
GET  /api/health
GET  /api/topics                 -> list topics
GET  /api/topics/:slug           -> get topic by slug (e.g., number-system, percentage)
GET  /api/videos/:topicId        -> videos for topic
GET  /api/questions/:topicId     -> MCQs for topic

Files:
- models/{Topic,Video,Question}.js
- controllers/*Controller.js
- routes/*Routes.js
- seeds/seed.js (Number System, Percentage, Profit & Loss demo data)
