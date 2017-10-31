var logger = require("./../logger/logger");
var yaml = require('yamljs');
var path = require('path');

function getConfigs(name, validator, callback) {
    logger.debug('getConfigs', name);

    var filePath = path.join(__dirname, "../../config/" + name + ".yml");
    var config = yaml.load(filePath);

    logger.debug('yaml file', yaml);

    validateConfig(config, validator, callback);
}

function validateConfig(config, validator, callback) {
    for (var i = 0; i < validator.length; ++i) {
        if (!(validator[i] in config)) {
            callback(false);
            logger.debug('validateConfig not valid', config, validator[i], "missing");
        }
    }
    logger.debug('validateConfig valid', config);
    callback(config);
}

exports.getConfigs = function (name, validator, callback) {
    getConfigs(name, validator, callback)
};