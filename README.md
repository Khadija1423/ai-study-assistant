# AI Study Assistant

A scalable React (Client) and Node.js/Express (Server) setup aimed at building an AI Study Assistant.

## Structure

- `/client`: React + Vite + TypeScript, Tailwind CSS, ShadCN UI
- `/server`: Node.js + Express + TypeScript + Mongoose
- `/shared`: Shared TypeScript types

## Requirements

### Pre-requisites

- Node.js installed
- MongoDB installed locally or access to a MongoDB Atlas cluster.
- Google Gemini AI API key.

### Setup

1. Install dependencies from the root folder:

   ```bash
   npm install
   ```

2. Set up environment variables:
   - Create a `.env` file in `/server` based on `/server/.env.example`.
   - Update the variables:
     - `MONGODB_URI`: The MongoDB connection string.
     - `GEMINI_API_KEY`: The API key for Gemini.
     - `GEMINI_MODEL`: (Optional) By default, uses `gemini-1.5-flash`.
     - `PORT`: (Optional) Server port. Defaults to 3001.

   - Create a `.env` file in `/client` based on `/client/.env.example`.
     - `VITE_API_URL`: Path to the API.

## Running Locally

To run the application locally (it will start both Client and Server concurrently):

```bash
npm run dev
```

- Client will run on Vite's default port (typically 5173).
- Server will run on port 3001.

### API Health Check

Once running, you can test the server health at:

```bash
curl http://localhost:3001/api/health
```

### MongoDB Atlas Vector Search

If you deploy this to production, you should set up an Atlas Vector Search index on the `chunks` collection.
Atlas requires this to be configured in the Atlas UI or via the Atlas API (it cannot be automated purely from Mongoose).
If it is not configured, the app will gracefully fall back to an in-memory cosine similarity search (which works well for hundreds of chunks).

1. Go to your MongoDB Atlas cluster.
2. Select **Search** -> **Create Search Index**.
3. Choose **JSON Editor**.
4. Select your Database and the `chunks` collection.
5. Paste the following configuration:
   \`\`\`json
   {
   "mappings": {
   "dynamic": true,
   "fields": {
   "embedding": {
   "dimensions": 768,
   "similarity": "cosine",
   "type": "knnVector"
   },
   "documentId": {
   "type": "token"
   }
   }
   }
   }
   \`\`\`
   _(Note: Dimensions should match the Gemini embedding model dimensions. Ensure you adjust if the model changes.)_
