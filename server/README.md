# CampusCare AI Agent (Backend Only)

A robust backend-only AI service for CampusCare that handles intelligent complaint management, SOS protocols, and productivity drafts.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Optional for AI features, required for full backend)

### Installation
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
   *The server runs on http://localhost:5000*

## 🤖 AI API Usage

**Endpoint:** `POST /api/ai/chat`  
**Content-Type:** `application/json`

### 1. File a Complaint (Infrastructure)
**Request:**
```json
{
  "text": "The fan in room 101 is broken"
}
```
**Response:** Auto-classifies as **Infrastructure**, assigns Priority **Medium**, and routes to **Maintenance Dept**.

### 2. Emergency / SOS
**Request:**
```json
{
  "text": "Help! There is a fight and someone is bleeding"
}
```
**Response:** Detects **Critical** priority and triggers **SOS Protocol**.

### 3. Productivity (Leave Application)
**Request:**
```json
{
  "text": "Write a leave application for sick leave"
}
```
**Response:** Generates a formal leave application draft.

## 📂 Project Structure
- `src/services/aiService.js`: Core logic for classification & analysis (Regex/Keyword engine).
- `src/controllers/aiController.js`: Request handling.
- `src/routes/aiRoutes.js`: API routing.
