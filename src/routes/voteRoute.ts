import express from "express";
import { castVote, getVoteSummary } from "../controllers/voteController";
import { protect, voterOnly } from "../middleware/authMiddleware";
import Candidate from "../models/Candidate";
import { asyncHandler } from "../middleware/asyncHandler";

const router = express.Router();

export const swaggerVoteTags = {
  tags: [
    {
      name: "Votes",
      description: "Voting operations for authenticated voters",
    },
  ],
};

export const swaggerVoteRoutes = {
  "/api/vote": {
    post: {
      summary: "Cast or update one or multiple votes",
      description:
        "Authenticated voters can cast, refresh, or update votes.\n\nSupports:\n" +
        " - **Single vote mode:** `{ candidateId, position }`\n" +
        " - **Batch vote mode:** `{ votes: [ { position, candidateId } ] }`\n\n" +
        "All votes automatically attach to the voter's registration number and overwrite previous choices per position.",
      tags: ["Votes"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              oneOf: [
                {
                  type: "object",
                  properties: {
                    candidateId: { type: "string" },
                    position: { type: "string" },
                  },
                  required: ["candidateId", "position"],
                },
                {
                  type: "object",
                  properties: {
                    votes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          position: { type: "string" },
                          candidateId: { type: "string" },
                        },
                        required: ["position", "candidateId"],
                      },
                    },
                  },
                  required: ["votes"],
                },
              ],
            },
          },
        },
      },
      responses: {
        201: { description: "Vote successfully recorded or updated." },
        400: { description: "Invalid or duplicate vote request." },
        401: { description: "Unauthorized." },
        403: { description: "Forbidden — voter privileges required." },
        500: { description: "Internal server error." },
      },
    },
  },
  "/api/votes/summary": {
    get: {
      summary: "Get summarized voting results grouped by position",
      description: "Retrieves all positions and their candidates with total votes in real-time.",
      tags: ["Votes"],
      responses: {
        200: { description: "Vote summary retrieved successfully." },
        500: { description: "Internal server error." },
      },
    },
  },
};

router.post(
  "/demo/reset",
  protect,
  voterOnly,
  asyncHandler(async (_req, res) => {
    await Candidate.updateMany({}, { $set: { totalVotes: 0 } });
    res.status(200).json({ success: true, message: "Demo votes reset." });
  })
);

router.post("/", protect, voterOnly, castVote);
router.get("/summary", getVoteSummary);

export default router;

