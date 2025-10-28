import express from "express";
import { castVote, getVoteSummary } from "../controllers/voteController.js";
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
        "Allows an authenticated voter to cast one or multiple votes for candidates.\n\n" +
        "Supports:\n" +
        " - **Single vote mode:** `{ candidateId, position }`\n" +
        " - **Batch vote mode:** `{ votes: [ { position, candidateId } ] }`\n\n" +
        "All votes are automatically linked to the authenticated voter's registration number.",
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
                      description:
                        "ID of the candidate being voted for (single-vote mode).",
                    },
                    position: {
                      type: "string",
                      example: "President",
                      description: "Position being voted for.",
                    },
                  },
                  required: ["candidateId", "position"],
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
        201: {
          description: "Vote successfully recorded.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: {
                    type: "string",
                    example:
                      "✅ Your vote for 'John Doe' as 'President' has been recorded successfully.",
                  },
                  data: {
                    type: "object",
                    properties: {
                      voterRegNumber: { type: "string", example: "FUE/ICT/001" },
                      candidateId: {
                        type: "string",
                        example: "67162a1f9c8c123456789abc",
                      },
                      position: { type: "string", example: "President" },
                    },
                  },
                },
              },
            },
          },
        },
        200: {
          description:
            "Batch vote submission completed (multi-vote mode).",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Vote submission complete." },
                  results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        position: { type: "string", example: "President" },
                        status: { type: "string", example: "success" },
                        message: {
                          type: "string",
                          example:
                            "✅ Your vote for 'John Doe' as 'President' has been recorded successfully.",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Bad request — invalid or duplicate vote.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: {
                    type: "string",
                    example: "You have already voted for 'President'.",
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized — invalid or missing token." },
        403: { description: "Forbidden — voter privileges required." },
        500: { description: "Internal server error." },
      },
    },
  },

  "/api/votes/summary": {
    get: {
      summary: "Get summarized voting results grouped by position",
      description:
        "Retrieves a list of all positions and their candidates with current total votes (both real and demo votes).",
      tags: ["Votes"],
      responses: {
        200: {
          description: "Vote summary retrieved successfully.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    position: { type: "string", example: "President" },
                    candidates: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", example: "67162a1f9c8c123456789abc" },
                          name: { type: "string", example: "John Doe" },
                          dept: { type: "string", example: "Computer Science" },
                          image: { type: "string", example: "https://example.com/john.jpg" },
                          totalVotes: { type: "number", example: 152 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        500: { description: "Internal server error." },
      },
    },
  },
};

// ======= ROUTES =======

/**
 * @route POST /api/vote
 * @desc Cast a vote for a candidate (single or multiple)
 * @access Private (authenticated voters only)
 */
router.post("/", protect, voterOnly, castVote);

/**
 * @route GET /api/votes/summary
 * @desc Retrieve grouped vote summary (public)
 * @access Public (or protect it if you prefer)
 */
router.get("/votes/summary", getVoteSummary);

export default router;
