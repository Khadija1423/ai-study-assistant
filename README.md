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
