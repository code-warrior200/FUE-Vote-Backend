// config/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Voting System API",
      version: "1.0.0",
      description: `
        This is the API documentation for the Voting System backend.
        Use the **Authorize** button to enter your JWT token for secured routes.
      `,
    },
    servers: [
      {
        url: "/", // ✅ relative URL so it works both locally and on Render
        description: "Current server",
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication and authorization endpoints",
      },
      {
        name: "Admin",
        description: "Admin dashboard and management endpoints",
      },
      {
        name: "Votes",
        description: "Voting and results operations",
      },
      {
        name: "Categories",
        description: "Category and candidate management endpoints",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js"], // adjust path if needed
};

export const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi };
