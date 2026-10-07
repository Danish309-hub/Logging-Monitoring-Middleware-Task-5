const fs = require("fs");
const path = require("path");

const logDirectory = path.join(__dirname, "../../logs");
const logFile = path.join(logDirectory, "app.log");

// Create logs folder if it does not exist
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

const logger = (message) => {
    const timestamp = new Date().toISOString();

    const logMessage = `${timestamp} | ${message}\n`;

    console.log(logMessage.trimEnd());

    // Non-blocking file write
    fs.appendFile(logFile, logMessage, (error) => {
        if (error) {
            console.error("Failed to write log:", error);
        }
    });
};

module.exports = logger;