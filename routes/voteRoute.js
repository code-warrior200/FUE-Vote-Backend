import express from "express";
import { processVotesAtomically } from "../controllers/voteController.js";
import { protect, voterOnly } from "../middleware/authMiddleware.js";
import Candidate from "../models/Candidate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

/* ========= SWAGGER TAGS ========= */
export const swaggerVoteTags = {
  tags: [
    {
      name: "Votes",
      description: "Voting operations for authenticated voters",
    },
  ],
};

/* ========= SWAGGER ROUTES ========= */
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
        200: { description: "Vote successfully recorded or updated." },
        400: { description: "Invalid or duplicate vote request." },
        401: { description: "Unauthorized." },
        403: { description: "Forbidden — voter privileges required." },
        500: { description: "Internal server error." },
      },
    },
  },
  "/api/vote/summary": {
    get: {
      summary: "Get summarized voting results grouped by position",
      description:
        "Retrieves all positions and their candidates with total votes in real-time.",
      tags: ["Votes"],
      responses: {
        200: { description: "Vote summary retrieved successfully." },
        500: { description: "Internal server error." },
      },
    },
  },
};

/* ========= CONTROLLERS ========= */

export const castVote = asyncHandler(async (req, res) => {
  const { candidateId, position, votes, isDemo } = req.body;

  const voterRegNumber = req.user?.regnumber || req.body.voterRegNumber;
  const io = req.app.get("io");

  if (!voterRegNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Missing voter registration number" });
  }

  let candidateIds = [];

  // Single vote
  if (candidateId && position) {
    candidateIds.push({ _id: candidateId, position });
  }
  // Multiple votes
  else if (Array.isArray(votes) && votes.length > 0) {
    candidateIds = votes.map((v) => ({
      _id: v.candidateId,
      position: v.position,
    }));
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid body. Provide {candidateId, position} or votes[].",
    });
  }

  const results = await processVotesAtomically({
    voterRegNumber,
    candidateIds,
    isDemo,
    io,
  });

  res.status(200).json({
    success: true,
    message: "Votes processed successfully (recorded/updated).",
    results,
  });
});

export const getVoteSummary = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find();

  const summary = candidates.reduce((acc, c) => {
    const position = c.position || "Unknown";
    if (!acc[position]) acc[position] = [];
    acc[position].push({
      id: c._id,
      name: c.name,
      department: c.department,
      image: c.image,
      totalVotes: c.totalVotes || 0,
    });
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    message: "Vote summary retrieved successfully.",
    data: summary,
  });
});

/* ========= ROUTES ========= */

// Cast or update votes (authenticated voters only)
router.post("/", protect, voterOnly, castVote);

// Public summary route
router.get("/summary", getVoteSummary);

export default router;
