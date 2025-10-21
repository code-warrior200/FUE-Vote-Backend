import express from "express";
import { castVote } from "../controllers/voteController.js";
import { protect, voterOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ======= SWAGGER TAGS =======
export const swaggerVoteTags = {
  tags: [
    {
      name: "Votes",
      description: "Voting operations for authenticated voters",
    },
  ],
};

// ======= SWAGGER ROUTE DEFINITIONS =======
export const swaggerVoteRoutes = {
  "/api/vote": {
    post: {
      summary: "Cast one or multiple votes",
      description:
        "Allows an authenticated voter to cast one or multiple votes for candidates. \
Supports both single vote submission (`candidateId`) and batch submission (`votes` array).",
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
                    candidateId: {
                      type: "string",
                      example: "67162a1f9c8c123456789abc",
                      description: "ID of the candidate being voted for (single-vote mode).",
                    },
                  },
                  required: ["candidateId"],
                },
                {
                  type: "object",
                  properties: {
                    votes: {
                      type: "array",
                      description: "List of votes for different positions.",
                      items: {
                        type: "object",
                        properties: {
                          position: {
                            type: "string",
                            example: "President",
                            description: "Position being voted for.",
                          },
                          candidateId: {
                            type: "string",
                            example: "67162a1f9c8c123456789abc",
                            description: "Candidate ID being voted for.",
                          },
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
        200: {
          description: "Vote(s) submitted successfully.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Vote submission complete." },
                  results: {
                    type: "array",
                    description: "Details of each vote processed (only for multi-vote mode).",
                    items: {
                      type: "object",
                      properties: {
                        position: { type: "string", example: "President" },
                        status: { type: "string", example: "success" },
                        message: {
                          type: "string",
                          example: "✅ Your vote for 'John Doe' as 'President' has been recorded successfully.",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Bad request — invalid data or duplicate vote." },
        401: { description: "Unauthorized — invalid or missing token." },
        403: { description: "Forbidden — voter privileges required." },
        500: { description: "Internal server error." },
      },
    },
  },
};

// ======= ROUTES =======

/**
 * @route POST /api/vote
 * @desc Cast a vote for a candidate
 * @access Private (authenticated voters only)
 */
router.post("/", protect, voterOnly, castVote);

export default router;
