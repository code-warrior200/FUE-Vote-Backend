import express from "express";
import { getAllCandidates } from "../controllers/candidateController";

const router = express.Router();

export const swaggerCandidateTags = {
  tags: [
    {
      name: "Candidates",
      description: "Candidate management and retrieval",
    },
  ],
};

export const swaggerCandidatesRoutes = {
  "/candidates": {
    get: {
      summary: "Get all candidates",
      description: "Retrieve a list of all candidates available in the system.",
      tags: ["Candidates"],
      responses: {
        200: {
          description: "Successfully retrieved the list of candidates.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    name: { type: "string", example: "John Doe" },
                    position: { type: "string", example: "President" },
                    votes: { type: "integer", example: 120 },
                  },
                },
              },
            },
          },
        },
        404: { description: "No candidates found." },
        500: { description: "Internal server error." },
      },
    },
  },
};

router.get("/", getAllCandidates);

export default router;

