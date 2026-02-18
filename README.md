# Study Hours Tracker - Microservices System

A complete, containerized microservices application for tracking study habits, featuring a React frontend, Python analytics engine, and dedicated services for authentication and data entry.

## 📁 Repository Structure
```text
├── auth-service/        # Python (FastAPI) - User Authentication
├── analytics-service/   # Python (Worker) - Data Aggregator
├── enter-data/          # Node.js (Express) - MySQL Data Entry
├── show-results/        # Node.js (Express) - MongoDB Analytics Provider
├── mysql-init/          # Database seeding (demo/demo1234)
├── App.tsx              # React Frontend (Tailwind + Recharts)
├── docker-compose.yml   # Full system orchestration
└── README.md            # You are here
```

## 🚀 How to Run (Docker)
1. **Clone the Repo**
2. **Launch everything**:
   ```bash
   docker compose up --build
   ```
3. **Access the App**:
   - Open your browser to: [http://localhost:3000](http://localhost:3000)
4. **Login**:
   - Username: `demo`
   - Password: `demo1234`

## 🧪 Tech Stack
- **Frontend**: React, Tailwind CSS, Recharts.
- **Backend APIs**: Node.js (Express), Python (FastAPI).
- **Background Engine**: Python.
- **Databases**: MySQL 8.0 (Raw), MongoDB 6.0 (Aggregated).
- **Orchestration**: Docker & Docker Compose.

## 🛠 Features
- **Secure Auth**: JWT based authentication.
- **Polyglot Architecture**: Uses both Python and JavaScript in one system.
- **High Performance**: Pre-computes analytics into MongoDB so the UI stays fast as your data grows.
- **Responsive UI**: Works perfectly on mobile and desktop.
