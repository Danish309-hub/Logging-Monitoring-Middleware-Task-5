const logger = require("../utils/logger");

const loggerMiddleware = (req, res, next) => {
    const startTime = Date.now();
    let responseBody;

    const originalJson = res.json;
    res.json = function (body) {
        responseBody = body;
        return originalJson.call(this, body);
    };

    const originalSend = res.send;
    res.send = function (body) {
        if (responseBody === undefined) {
            responseBody = body;
        }

        return originalSend.call(this, body);
    };

    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const response =
            responseBody === undefined
                ? ""
                : ` | Response: ${
                    Buffer.isBuffer(responseBody)
                        ? responseBody.toString()
                        : typeof responseBody === "string"
                            ? responseBody
                            : JSON.stringify(responseBody)
                }`;

        const logMessage =
            `${req.method} | ${req.originalUrl} | ${duration}ms | ${res.statusCode}` +
            (res.statusCode >= 400 ? response : "");

        logger(logMessage);
    });

    next();
};

module.exports = loggerMiddleware;