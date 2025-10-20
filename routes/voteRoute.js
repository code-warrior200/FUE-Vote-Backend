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
      summary: "Cast a vote",
      description: "Allows an authenticated voter to cast a vote for a candidate.",
      tags: ["Votes"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                candidateId: { type: "integer", example: 1 },
              },
              required: ["candidateId"],
            },
          },
        },
      },
      responses: {
        200: { description: "Vote cast successfully." },
        400: { description: "Bad request — invalid data." },
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
