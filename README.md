# Full-Stack Appointment Booking Application

This is a full-stack appointment booking application for a small clinic, built to allow patients to book available slots and admins to view all appointments.

## Submission Checklist

- **Frontend URL**: `https://appointment-booking-app-one.vercel.app/login`
- **API URL**: `https://appointment-booking-app-2tmw.onrender.com`

- **Repo URL**: `https://github.com/sam-1224/appointment-booking-app`
- **Patient Credentials**: `patient@example.com` / `Passw0rd!`
- **Admin Credentials**: `admin@example.com` / `Passw0rd!`
- **Run Locally Verified**: Yes, steps are included below.
- **cURL Steps Included**: Yes, verification steps are included below.
- **Trade-offs & Next Steps Noted**: Yes, documented below.

---

## Core Features

- **Patient**: User registration and login, view available slots for the next 7 days, book an appointment, and view personal bookings.
- **Admin**: Admin login and a dashboard to view all bookings across the entire system.
- **UI**: A clean, responsive interface built with a permanent dark mode theme.
- **Auto-Slot Generation**: The backend automatically generates slots for the next week if the current week becomes fully booked, ensuring availability.

---

## Tech Stack & Rationale

| Tier           | Technology                                       | Rationale                                                                                                                                      |
| :------------- | :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**   | **React (Vite)** + **Tailwind CSS**              | Vite provides a fast development experience. React is ideal for building dynamic UIs. Tailwind CSS allows for rapid, utility-first styling.    |
| **Backend**    | **Node.js** + **Express**                        | A standard, lightweight, and fast choice for building REST APIs. Its extensive ecosystem is a major advantage.                                 |
| **Database**   | **PostgreSQL** (Production) / **SQLite** (Dev)   | PostgreSQL is a powerful and reliable relational database perfect for production. SQLite is file-based and ideal for simple local development. |
| **ORM**        | **Prisma**                                       | Provides excellent type-safety and an intuitive API for database operations, simplifying queries and migrations.                               |
| **Auth**       | **JSON Web Tokens (JWT)**                        | A stateless and secure method for handling user authentication and role-based access control between the frontend and backend.                 |
| **Deployment** | **Render** (API), **Vercel** (UI), **Neon** (DB) | A modern, Git-native deployment stack with generous free tiers perfect for rapid deployment and continuous integration.                        |

---

## Getting Started

Follow these steps to set up and run the project on your local machine.

### Prerequisites

-   Node.js (v18 or higher)
-   npm (or another package manager like yarn/pnpm)
-   Git

### Environment Variables

You need to create a `.env` file in **both** the `backend` and `frontend` directories.

1.  **Backend Environment (`backend/.env`)**

    Create a file at `backend/.env` and paste the following content.

    ```
    # For local development with SQLite
    DATABASE_URL="file:./dev.db"

    # A strong, unique secret for signing JWTs
    JWT_SECRET="YOUR_SUPER_SECRET_KEY_12345!@#$%"

    # The URL of your running frontend for CORS
    FRONTEND_ORIGIN="http://localhost:5173"

    # Seeded user credentials
    SEED_ADMIN_EMAIL="admin@example.com"
    SEED_ADMIN_PASS="Password!"
    SEED_PATIENT_EMAIL="patient@example.com"
    SEED_PATIENT_PASS="Password!"
    ```

2.  **Frontend Environment (`frontend/.env`)**

    Create a file at `frontend/.env` and paste the following content.

    ```
    VITE_API_URL="http://localhost:4000"
    ```

### Running Locally

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/Your-Username/appointment-booking-app.git](https://github.com/Your-Username/appointment-booking-app.git)
    cd appointment-booking-app
    ```

2.  **Start the Backend Server** (in one terminal window):
    ```bash
    cd backend
    npm install
    npx prisma migrate dev
    npm run dev
    ```
    The backend API will be running on `http://localhost:4000`.

3.  **Start the Frontend Server** (in a *new* terminal window):
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    The frontend application will be running on `http://localhost:5173`.

---

## API Verification (cURL)

You can test the core API endpoints directly from your terminal.

1.  **Login as Patient & Get Token**:
    ```bash
    TOKEN=$(curl -s -X POST http://localhost:4000/api/login -H "Content-Type: application/json" -d '{"email":"patient@example.com", "password":"Password!"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p') && echo "TOKEN SET"
    ```

2.  **Get Available Slots** (adjust dates if necessary):
    ```bash
    curl -s "http://localhost:4000/api/slots?from=2025-08-10&to=2025-08-17"
    ```

3.  **Book a Slot** (replace `1` with a real slot ID from the previous command):
    ```bash
    curl -s -X POST http://localhost:4000/api/book -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"slotId": 1}'
    ```

4.  **View Your Bookings**:
    ```bash
    curl -s -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/my-bookings
    ```

---

## Architecture & Design Decisions

-   **Folder Structure**: A monorepo-style structure with separate `backend` and `frontend` directories was chosen for a clear separation of concerns.
-   **Authentication**: JWTs containing `userId` and `role` are issued upon login. A middleware on the backend verifies the token on protected routes and a `requireRole` middleware checks for 'admin' or 'patient' permissions.
-   **Booking Concurrency**: To prevent double-booking, a `@@unique([slotId])` constraint is applied to the `Booking` model in the Prisma schema. This makes the booking action atomic at the database level. If a duplicate booking is attempted, the database rejects it, and the API returns a `409 SLOT_TAKEN` error.
-   **Error Handling**: The API uses a standardized JSON error shape (`{ "error": { "code": "...", "message": "..." } }`) for all failures, making it predictable for the frontend to handle.

---

## Deployment

The application is deployed using a Git-native pipeline:
1.  A PostgreSQL database is hosted on **Neon**.
2.  The backend Node.js application is deployed on **Render** as a Web Service, connected to the Neon database. The start command is `npx prisma migrate deploy && npm start` to run production migrations automatically.
3.  The frontend React application is deployed on **Vercel**, with the `VITE_API_URL` environment variable pointing to the live Render API URL.
4.  The `FRONTEND_ORIGIN` environment variable on Render is set to the Vercel URL to enable CORS.

---

## Known Limitations & Future Improvements

-   **Time Zones**: All slot times are currently handled in UTC. For a real-world application, this should be expanded to handle clinic-specific and user-specific time zones.
-   **No Cancellations**: Patients cannot cancel or reschedule appointments through the UI.
-   **Simple Validation**: Input validation is basic. More comprehensive validation using a library like Zod could be implemented.
-   **Testing**: The project lacks automated tests. Unit tests for the backend logic and end-to-end tests for the UI flows using Cypress or Playwright would be the next priority.