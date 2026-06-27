# LiveBoard 🏟️

> Real-time sports match tracking and commentary system powered by WebSockets and secured by Arcjet.

## Overview

**LiveBoard** is a robust backend service designed to provide real-time updates for sports matches. It allows clients to fetch match schedules, receive live score updates, and follow play-by-play commentary instantly via WebSockets.

Built with performance and security in mind, LiveBoard leverages **Arcjet** for advanced protection (rate limiting, bot detection) and **Drizzle ORM** for type-safe database interactions.

**Key Idea:** Delivering live sports data with low latency while maintaining strict security and data integrity.

## Features ✨

- **Real-Time Updates**: Instant notifications for new matches and commentary via WebSockets.
- **RESTful API**: Clean endpoints for managing matches and commentary.
- **Advanced Security**: Integrated **Arcjet** protection including:
  - Shield against common attacks.
  - Bot detection.
  - Sliding window rate limiting.
- **Type-Safe Database**: **PostgreSQL** schema management using **Drizzle ORM**.
- **Robust Validation**: Request data validation using **Zod** schemas.
- **Performance Monitoring**: Integrated APM Insight for tracking application health.

## Tech Stack 🛠️

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: PostgreSQL
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Real-Time**: [ws](https://github.com/websockets/ws) (WebSockets)
- **Security**: [Arcjet](https://arcjet.com/)
- **Validation**: [Zod](https://zod.dev/)
- **Monitoring**: APM Insight

## Project Structure 📂

```
liveboard/
├── drizzle/                # Database migrations and snapshots
├── src/
│   ├── db/                 # Database connection and schema definitions
│   ├── routes/             # Express route handlers (matches, commentary)
│   ├── utils/              # Helper utility functions
│   ├── validation/         # Zod schemas for request validation
│   ├── ws/                 # WebSocket server logic
│   ├── arcjet.js           # Arcjet security configuration
│   └── index.js            # Application entry point
├── drizzle.config.js       # Drizzle Kit configuration
└── package.json            # Project dependencies and scripts
```

## Getting Started 🚀

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** database
- **npm** or **yarn**

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/prabuddhxdev/Websockets.git
    cd Websockets
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory (or copy an example if available):
    ```env
    PORT=8080
    HOST=0.0.0.0
    DATABASE_URL="postgresql://user:password@localhost:5432/liveboard"
    ARCJET_KEY="aj_..."
    ARCJET_MODE="LIVE" # or "DRY_RUN"
    ```

4.  **Database Migration**:
    Push the schema to your database:
    ```bash
    npm run db:migrate
    ```

### Running Locally

-   **Development Mode** (with watch):
    ```bash
    npm run dev
    ```

-   **Production Mode**:
    ```bash
    npm start
    ```

The server will start at `http://localhost:8080` and the WebSocket server at `ws://localhost:8080/ws`.

## Usage 📡

### REST API

**1. List Matches**
Fetch a list of recent matches.
-   **Endpoint**: `GET /matches`
-   **Query Params**: `limit` (optional, max 100)

**2. Create a Match**
-   **Endpoint**: `POST /matches`
-   **Body**:
    ```json
    {
      "sport": "Soccer",
      "homeTeam": "Red Dragons",
      "awayTeam": "Blue Knights",
      "startTime": "2023-10-27T14:00:00Z",
      "endTime": "2023-10-27T16:00:00Z"
    }
    ```

### WebSocket

Connect to `ws://localhost:8080/ws` to receive real-time events.

**Events Emitted:**
-   `match_created`: When a new match is scheduled.
-   `commentary_added`: When new commentary is posted for a match.

## Configuration ⚙️

| Variable                 | Description                         | Default  |
| :----------------------- | :---------------------------------- | :------- |
| `PORT`                   | Server port                         | `8080`   |
| `DATABASE_URL`           | PostgreSQL connection string        | Required |
| `ARCJET_KEY`             | Arcjet API Key for security         | Optional |
| `ARCJET_MODE`            | Security mode (`LIVE` or `DRY_RUN`) | `LIVE`   |
| `APMINSIGHT_LICENSE_KEY` | APM Insight License Key             | Optional |

## Validation 🛡️

This project uses **Zod** to ensure data integrity.

-   **Match Creation**: Validates that `endTime` is chronologically after `startTime`.
-   **Types**: Ensures scores are non-negative integers and team names are non-empty strings.

Example Schema (`src/validation/matches.js`):
```javascript
export const createMatchSchema = z.object({
  sport: z.string().min(1),
  // ...
}).superRefine((data, ctx) => {
  // Validates end > start
});
```

## Future Improvements 🔮

-   [ ] **Authentication**: Add JWT-based auth for admin routes (creating matches/commentary).
-   [ ] **More Sports**: Support specific scoring rules for different sports (Basketball, Tennis).
-   [ ] **Analytics**: Dashboard for viewing match engagement and API usage.
-   [ ] **Docker**: Containerize the application for easier deployment.

## Contributing 🤝

Contributions are welcome!

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License 📄