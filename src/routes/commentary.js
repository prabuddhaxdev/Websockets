import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { desc, eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get("/", async (req, res) => {
  // 1. Validate req.params
  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: "Invalid match ID",
      details: paramsParsed.error.issues,
    });
  }
  const matchId = paramsParsed.data.id;

  // 2. Validate req.query
  const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: queryParsed.error.issues,
    });
  }

  const limit = Math.min(queryParsed.data.limit ?? 100, MAX_LIMIT);

  try {
    // 3. Fetch data
    const results = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    res.status(200).json({
      message: "Commentary list fetched successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error fetching commentary:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch commentary",
    });
  }
});

commentaryRouter.post("/", async (req, res) => {
  // 1. Validate req.params (matchId)
  const paramsParsed = matchIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      error: "Invalid match ID",
      details: paramsParsed.error.issues,
    });
  }
  const matchId = paramsParsed.data.id;

  // 2. Validate req.body
  const bodyParsed = createCommentarySchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      error: "Invalid commentary data",
      details: bodyParsed.error.issues,
    });
  }

  const commentaryData = bodyParsed.data;

  // Ensure eventType is present as it is required by the DB schema
  // Default to "general" if not provided in the optional field
  const eventType = commentaryData.eventType || "general";

  try {
    // 3. Execute database operations
    const [newCommentary] = await db
      .insert(commentary)
      .values({
        matchId,
        minute: commentaryData.minute,
        sequence: commentaryData.sequence,
        period: commentaryData.period,
        eventType: eventType,
        actor: commentaryData.actor,
        team: commentaryData.team,
        message: commentaryData.message,
        metadata: commentaryData.metadata,
        tags: commentaryData.tags,
        // created_at is automatically handled by defaultNow() in schema
      })
      .returning();

    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(matchId, newCommentary);
    }

    // 4. Return success response
    return res.status(201).json({
      message: "Commentary created successfully",
      data: newCommentary,
    });
  } catch (error) {
    console.error("Error creating commentary:", error);

    // 5. Error Handling
    // PostgreSQL Error Codes
    if (error.code === "23505") {
      // Unique violation
      return res.status(409).json({
        error: "Conflict",
        message: "A commentary with this sequence/ID already exists",
      });
    }

    if (error.code === "23503") {
      // Foreign key violation
      // Check which constraint failed to give better error message
      if (error.constraint === "commentary_match_id_matches_id_fk") {
        return res.status(404).json({
          error: "Not Found",
          message: `Match with ID ${matchId} not found`,
        });
      }
      return res.status(404).json({
        error: "Not Found",
        message: "Referenced entity not found",
      });
    }

    // Generic 500
    return res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create commentary",
    });
  }
});
