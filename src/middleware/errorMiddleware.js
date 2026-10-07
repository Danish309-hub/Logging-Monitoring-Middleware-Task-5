const logger = require("../utils/logger");

const errorMiddleware = (err, req, res, next) => {
    const errorMessage = `
ERROR | ${req.method} | ${req.originalUrl}
Message: ${err.message}
Stack Trace:
${err.stack}
`;

    logger(errorMessage);

    const isDuplicateSku =
        err.code === "23505" && err.constraint === "products_sku_key";

    res.status(isDuplicateSku ? 409 : err.statusCode || 500).json({
        success: false,
        message: isDuplicateSku
            ? "SKU already exists"
            : err.message || "Internal Server Error"
    });
};

module.exports = errorMiddleware;