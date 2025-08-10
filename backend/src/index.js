// backend/src/index.js
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const FRONTEND = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(helmet());
app.use(express.json());
app.use(cors({ origin: FRONTEND }));
if (process.env.NODE_ENV === "production") {
  app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));
}

const errorShape = (code, message) => ({ error: { code, message } });

const signToken = (user) =>
  jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

const authMiddleware = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth)
    return res
      .status(401)
      .json(errorShape("UNAUTHENTICATED", "Missing Authorization"));
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res
      .status(401)
      .json(errorShape("UNAUTHENTICATED", "Malformed token"));
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json(errorShape("UNAUTHENTICATED", "Invalid token"));
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user)
    return res.status(401).json(errorShape("UNAUTHENTICATED", "No user"));
  if (req.user.role !== role)
    return res.status(403).json(errorShape("FORBIDDEN", "Insufficient role"));
  next();
};

// Helper: generate slots in 30-min intervals between 9am–5pm (UTC)
async function generateSlotsForDays(startDate, days) {
  for (let d = 0; d < days; d++) {
    const day = new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate() + d
      )
    );
    for (let hour = 9; hour < 17; hour++) {
      for (let m = 0; m < 60; m += 30) {
        const start = new Date(
          Date.UTC(
            day.getUTCFullYear(),
            day.getUTCMonth(),
            day.getUTCDate(),
            hour,
            m,
            0
          )
        );
        const end = new Date(start.getTime() + 30 * 60 * 1000);

        const exists = await prisma.slot.findFirst({
          where: { startAt: start },
        });
        if (!exists) {
          await prisma.slot.create({ data: { startAt: start, endAt: end } });
        }
      }
    }
  }
}

// Register (patient)
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password)
    return res
      .status(400)
      .json(errorShape("INVALID_INPUT", "name,email,password required"));
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: "patient" },
    });
    return res.status(201).json({ id: user.id, email: user.email });
  } catch (e) {
    if (e?.code === "P2002")
      return res
        .status(409)
        .json(errorShape("EMAIL_EXISTS", "Email already in use"));
    console.error("Register error", e);
    return res.status(500).json(errorShape("SERVER_ERROR", "Unexpected error"));
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res
      .status(400)
      .json(errorShape("INVALID_INPUT", "email,password required"));
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res
      .status(401)
      .json(errorShape("INVALID_CREDENTIALS", "Email or password incorrect"));
  const ok = await bcrypt.compare(password, user.password);
  if (!ok)
    return res
      .status(401)
      .json(errorShape("INVALID_CREDENTIALS", "Email or password incorrect"));
  const token = signToken(user);
  return res.status(200).json({ token, role: user.role });
});

// Get available slots in date range (with auto-generate next week if empty)
app.get("/api/slots", async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to)
    return res
      .status(400)
      .json(errorShape("INVALID_INPUT", "from and to required as YYYY-MM-DD"));

  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (isNaN(fromDate) || isNaN(toDate))
    return res.status(400).json(errorShape("INVALID_INPUT", "Invalid dates"));

  const slots = await prisma.slot.findMany({
    where: {
      startAt: { gte: fromDate },
      endAt: { lte: new Date(toDate.setHours(23, 59, 59)) },
    },
    include: { booking: true },
    orderBy: { startAt: "asc" },
  });

  let available = slots
    .filter((s) => s.booking === null)
    .map((s) => ({
      id: s.id,
      startAt: s.startAt,
      endAt: s.endAt,
    }));

  if (available.length === 0) {
    const nextWeekStart = new Date();
    nextWeekStart.setDate(nextWeekStart.getDate() + 1); // tomorrow
    await generateSlotsForDays(nextWeekStart, 7);

    const futureSlots = await prisma.slot.findMany({
      where: {
        startAt: { gte: nextWeekStart },
        booking: null,
      },
      orderBy: { startAt: "asc" },
    });

    available = futureSlots.map((s) => ({
      id: s.id,
      startAt: s.startAt,
      endAt: s.endAt,
    }));
  }

  return res.json({ slots: available });
});

// Book a slot (patient only)
app.post(
  "/api/book",
  authMiddleware,
  requireRole("patient"),
  async (req, res) => {
    const { slotId } = req.body || {};
    if (!slotId)
      return res
        .status(400)
        .json(errorShape("INVALID_INPUT", "slotId required"));
    try {
      const booking = await prisma.booking.create({
        data: { slotId: Number(slotId), userId: req.user.userId },
      });
      return res.status(201).json({ id: booking.id, slotId: booking.slotId });
    } catch (e) {
      if (e?.code === "P2002")
        return res
          .status(409)
          .json(errorShape("SLOT_TAKEN", "Slot already taken"));
      console.error("Booking error", e);
      return res
        .status(500)
        .json(errorShape("SERVER_ERROR", "Unexpected error"));
    }
  }
);

// My bookings (patient)
app.get(
  "/api/my-bookings",
  authMiddleware,
  requireRole("patient"),
  async (req, res) => {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.userId },
      include: { slot: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ bookings });
  }
);

// All bookings (admin)
app.get(
  "/api/all-bookings",
  authMiddleware,
  requireRole("admin"),
  async (req, res) => {
    const bookings = await prisma.booking.findMany({
      include: { user: true, slot: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ bookings });
  }
);

// Seed admin/patient and generate slots for next 7 days
async function seedDefaults() {
  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPass = process.env.SEED_ADMIN_PASS;
    if (adminEmail && adminPass) {
      const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
      });
      if (!existingAdmin) {
        const hashed = await bcrypt.hash(adminPass, 10);
        await prisma.user.create({
          data: {
            name: "Admin",
            email: adminEmail,
            password: hashed,
            role: "admin",
          },
        });
        console.log("Seeded admin:", adminEmail);
      } else {
        console.log("Admin already exists:", adminEmail);
      }
    }

    const patientEmail = process.env.SEED_PATIENT_EMAIL;
    const patientPass = process.env.SEED_PATIENT_PASS;
    if (patientEmail && patientPass) {
      const existingPatient = await prisma.user.findUnique({
        where: { email: patientEmail },
      });
      if (!existingPatient) {
        const hashed = await bcrypt.hash(patientPass, 10);
        await prisma.user.create({
          data: {
            name: "Patient",
            email: patientEmail,
            password: hashed,
            role: "patient",
          },
        });
        console.log("Seeded patient:", patientEmail);
      } else {
        console.log("Patient already exists:", patientEmail);
      }
    }

    // Initial slots for next 7 days
    const now = new Date();
    await generateSlotsForDays(now, 7);
    console.log("Slots seeded for next 7 days (UTC)");
  } catch (e) {
    console.error("Seeding error", e);
  }
}

(async () => {
  await seedDefaults();
  app.listen(PORT, () =>
    console.log(`API running at http://localhost:${PORT}`)
  );
})();
