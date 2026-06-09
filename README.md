⚡ SmartQueue OS

SmartQueue OS is a modern, responsive, and fully synchronized Smart Queue Management System built with React, Firebase, and Tailwind CSS. Designed to optimize customer flow in high-traffic service branches (like banks, clinics, or government offices), it connects three distinct screens into one real-time cloud-coordinated ecosystem.

🖥️ Live Web App Demo: https://chamal01.github.io/smart-queue/

📂 Source Code Repository: https://github.com/chamal01/smart-queue

🚀 Key Features

SmartQueue OS consists of four highly integrated portals that update instantly across all open tabs and devices:

📸 1. AI Kiosk Simulator (Customer Entry)

Webcam Stream integration: Accesses camera feeds locally to simulate facial detection.

Visual Tokenization: Snaps a customer photo upon joining the queue to eliminate paper tickets.

Dynamic Metadata: Issues structured sequential token numbers (e.g., A001, D002) calculated using live service queue depth.

🖥️ 2. Live Waiting Room Display Board

Real-time Event Broadcasting: Instantly alerts waiting rooms when an officer calls a customer.

Fluid Lobby Ticker: Displays rolling informational marquee messages.

Visual Priority Routing: Clearly maps token numbers to their corresponding counter destinations.

👤 3. Officer Workspace (Staff Portal)

Dynamic Counter Filtering: Intelligently limits the queue views to match only the services that specific counter supports.

Visual Verification: Previews the next customer's photo before they arrive at the desk.

Status Management: Provides one-click triggers to Complete, Skip, or Hold customer sessions.

📊 4. Admin Analytics Dashboard

Real-time KPI Tracking: Visualizes key performance stats like waiting vs. completed transaction volumes.

Live Audit Logs: Offers tabular lists of historical events with fully interactive sorting configurations.

Officer Target Trackers: Displays progression metrics representing daily and monthly KPIs.

Custom Excel Reports: Generates targeted, localized CSV file reports filtered by custom date ranges.

🛠️ The Tech Stack

Frontend Library: React.js (Component-driven state engine)

Real-time Database: Firebase Firestore (Synced using real-time snapshot listeners)

Authentication: Firebase Auth (Configured with secure Anonymous Sign-In)

Styling Engine: Tailwind CSS (Fluid responsive utility design)

Vector Graphics: Lucide React & Inline SVGs

Deployment: Hosted via GitHub Pages

💻 Local Setup Instructions

Get the project running on your development environment in under 5 minutes:

Prerequisites

Ensure you have Node.js (LTS) and Git installed.

Installation Steps

Clone the repository:

git clone [https://github.com/chamal01/smart-queue.git](https://github.com/chamal01/smart-queue.git)
cd smart-queue


Install project dependencies:

npm install


Install Tailwind & Lucide icons:

npm install tailwindcss @tailwindcss/vite lucide-react


Add Firebase configuration:
Open src/App.jsx, locate the firebaseConfig block, and replace the placeholder fields with your own web app credentials from your Firebase Console.

Start the local development server:

npm run dev


Open http://localhost:5173/ in your browser.

🔒 Firebase Security Rules (Firestore)

To enable live synchronization, publish these security rules in your Firestore Database > Rules tab:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/public/data/{collection}/{document} {
      allow read, write: if true;
    }
  }
}


Note: Ensure you have also gone to your Firebase Console > Authentication > Sign-in method and enabled Anonymous sign-in.

📂 Deployment

The project is configured to publish automatically to GitHub Pages using the gh-pages package.

To deploy your custom branch changes live:

npm run deploy


This builds the production package into /dist and updates the live site instantly.
