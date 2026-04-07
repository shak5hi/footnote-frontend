const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "FootNote API",
            version: "1.0.0",
            description: "FootNote Authentication API",
        },
        servers: [
            {
                url: "http://localhost:5001",
            },
        ],
    },
    apis: ["./routes/*.js"], // This line is very important
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };