var winston = require('winston');
winston.emitErrs = true;

const logger = new (winston.Logger)({
    transports: [
        // colorize the output to the console
        new (winston.transports.Console)({
            timestamp: new Date().toLocaleTimeString(),
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true
        }),
        new (require('winston-daily-rotate-file'))({
            filename: "./logs/-results.log",
            timestamp: new Date().toLocaleTimeString(),
            datePattern: 'yyyy-MM-dd',
            prepend: true,
            level: "info",
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        }),
        new winston.transports.File({
            level: 'debug',
            filename: './logs/all-logs.log',
            handleExceptions: true,
            json: true,
            maxsize: 5242880, //5MB
            maxFiles: 5,
            colorize: false
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function (message, encoding) {
        logger.info(message);
    }
};
