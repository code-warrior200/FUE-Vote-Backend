import express from "express";
import {
  getCandidates,
  addCandidate,
  getVoteSummary as getAdminVoteSummary,
  getAllCandidates,
} from "../controllers/adminController";
import { resetAllVotes, resetVotes } from "../controllers/voteController";
import { protect, adminOnly } from "../middleware/authMiddleware";

const router = express.Router();

export const swaggerAdminTags = {
  tags: [
    {
      name: "Admin",
      description: "Admin operations related to voting",
    },
  ],
};

export const swaggerVoteSummary = {
  "/admin/votes/summary": {
    get: {
      summary: "Get vote summary (admin only)",
      description: "Retrieve a summary of all votes in the system. Accessible only by authenticated admins.",
      tags: ["Admin"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Successfully retrieved vote summary.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  totalVotes: { type: "integer", example: 150 },
                  candidates: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "Candidate A" },
                        votes: { type: "integer", example: 75 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { description: "Unauthorized - Missing or invalid token." },
        403: { description: "Forbidden - Admin privileges required." },
        500: { description: "Internal server error." },
      },
    },
  },
  "/admin/candidates": {
    get: {
      summary: "List public candidates",
      description: "Retrieve all candidates without admin-only metadata.",
      tags: ["Admin"],
      responses: {
        200: { description: "Candidates retrieved." },
      },
    },
    post: {
      summary: "Create a new candidate",
      description: "Add a candidate to an existing category. Admin privileges required.",
      tags: ["Admin"],
      security: [{ bearerAuth: [] }],
      responses: {
        201: { description: "Candidate created." },
        400: { description: "Validation error." },
        409: { description: "Duplicate candidate." },
      },
    },
  },
  "/admin/all-candidates": {
    get: {
      summary: "List all candidates (admin view)",
      description: "Retrieve every candidate with administrative metadata.",
      tags: ["Admin"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "All candidates retrieved." },
      },
    },
  },
  "/admin/votes/reset": {
    post: {
      summary: "Reset votes for a single position",
      description: "Remove votes and totals for a specific position.",
      tags: ["Admin"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Votes reset." },
        400: { description: "Missing position." },
      },
    },
  },
  "/admin/votes/reset-all": {
    delete: {
      summary: "Reset all votes",
      description: "Clear all votes and totals in the system.",
      tags: ["Admin"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "All votes reset." },
      },
    },
  },
};

router.post("/add-candidate", protect, adminOnly, addCandidate);
router.post("/candidates", protect, adminOnly, addCandidate);

router.get("/candidates", getCandidates);
router.get("/all-candidates", protect, adminOnly, getAllCandidates);

router.get("/vote-summary", protect, adminOnly, getAdminVoteSummary);
router.get("/votes/summary", protect, adminOnly, getAdminVoteSummary);

router.post("/votes/reset", protect, adminOnly, resetVotes);
router.post("/reset", protect, adminOnly, resetVotes);

router.delete("/votes/reset-all", protect, adminOnly, resetAllVotes);
router.delete("/reset-all", protect, adminOnly, resetAllVotes);

export default router;

