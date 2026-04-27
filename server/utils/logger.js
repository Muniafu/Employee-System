const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../../logs/system.log');

exports.error = (message, meta = {}) => {
    const log = `[${new Date().toISOString()}] ERROR: ${message} ${JSON.stringify(meta)}\n`;
    fs.appendFileSync(logFile, log);
};

exports.info = (message, meta = {}) => {
    const log = `[${new Date().toISOString()}] INFO: ${message} ${JSON.stringify(meta)}\n`;
    fs.appendFileSync(logFile, log);
};