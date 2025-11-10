import path from "path";
import swaggerJSDoc, { type Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FUE Voting System API",
      version: "1.0.0",
      description: `
        # FUE Voting System API Documentation
        
        Welcome to the FUE Voting System API. This API provides endpoints for managing elections, candidates, categories, and votes.
        
        ## Authentication
        Most endpoints require JWT authentication. To authenticate:
        1. Use the login endpoints to obtain a JWT token
        2. Click the **Authorize** button above
        3. Enter your token in the format: \`Bearer <your-token>\`
        4. The token will be included in all subsequent requests
        
        ## User Roles
        - **Admin**: Full access to all endpoints including candidate management and vote reset
        - **Voter**: Can view candidates and cast votes
        
        ## Endpoints Overview
        - **Auth**: User authentication and token management
        - **Categories**: Manage voting categories
        - **Candidates**: View and manage candidates
        - **Votes**: Cast votes and view results
        - **Admin**: Administrative operations (admin only)
        
        ## Rate Limiting
        Currently, there are no rate limits imposed. Please use the API responsibly.
        
        ## Support
        For issues or questions, please contact the system administrator.
      `,
      contact: {
        name: "API Support",
        email: "support@fue.edu.eg",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: "/",
        description: "Current server",
      },
      {
        url: "http://localhost:5000",
        description: "Local development server",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication and authorization endpoints. Login, token refresh, and user information.",
      },
      {
        name: "Categories",
        description: "Category management endpoints. Create and retrieve voting categories.",
      },
      {
        name: "Candidates",
        description: "Candidate management endpoints. View all candidates in the system.",
      },
      {
        name: "Votes",
        description: "Voting operations. Cast votes and view voting results summary.",
      },
      {
        name: "Admin",
        description: "Admin dashboard and management endpoints. Requires admin authentication. Manage candidates, view detailed vote summaries, and reset votes.",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token obtained from the login endpoints",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Error message",
            },
            success: {
              type: "boolean",
              example: false,
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              description: "Success message",
            },
          },
        },
      },
    },
  },
  apis: [
    path.join(process.cwd(), "src/routes/*.ts"),
    path.join(process.cwd(), "dist/routes/*.js"),
  ],
};

export const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi };

