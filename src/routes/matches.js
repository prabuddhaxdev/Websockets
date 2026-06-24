import { Router } from "express";
import {
  createMatchSchema,
  listMatchesQuerySchema,
} from "../validation/matches.js";
import { db } from "../db/db.js";
import { getMatchStatus } from "../utils/match-status.js";
import { matches } from "../db/schema.js";
import { desc } from "drizzle-orm";

export const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get("/", async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      errors: "Invalid query parameters",
      details: parsed.error.issues,
    });
  }
  const limit = Math.min(parsed.data.limit ?? 10, MAX_LIMIT);

  try {
    const results = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt))
      .limit(limit);

    res.json({ matches: results });
  } catch (error) {
    return res.status(500).json({
      errors: "Failed to fetch matches",
      details: parsed.error.issues,
    });
  }
});

matchRouter.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      errors: "Invalid match data",
      details: parsed.error.issues,
    });
  }

  const { startTime, endTime, homeScore, awayScore } = parsed.data;

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();

    return res.status(201).json({ message: "Match Created", match: event });
  } catch (error) {
    return res.status(500).json({
      errors: "Failed to create match",
      details: parsed.error.issues,
    });
  }
});
