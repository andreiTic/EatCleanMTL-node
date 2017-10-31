var database = require("./../database/database");
var Twitter = require('twitter');
var yamlConfig = require('./config');
var logger = require("../logger/logger");
var configkeys = ["consumer_key", "consumer_secret", "access_token_key", "access_token_secret", "enabled"];

exports.tweetListNewContrevenant = function () {
    database.getListNewContrevenant(function (result) {
        var text = "Nouveau contrevenant: ";
        if (result) {
            for (var i = 0; i < result.length; ++i) {
                sendTweet(text + result[i], function (error, tweet, response) {
                    if (!error) {
                        logger.debug(tweet);
                    } else {
                        logger.debug(error);
                    }
                });
            }
        }
    });
};

function sendTweet(text, callback) {
    yamlConfig.getConfigs("twitter", configkeys, function (config) {
        if (config) {
            var consumer_key = config["consumer_key"];
            var consumer_secret = config["consumer_secret"];
            var access_token_key = config["access_token_key"];
            var access_token_secret = config["access_token_secret"];
            var enabled = config["enabled"];

            if (!enabled) {
                logger.info("Twitter is not enabled");
                return callback("Twitter is not enabled");
            }

            var client = new Twitter({
                consumer_key: consumer_key,
                consumer_secret: consumer_secret,
                access_token_key: access_token_key,
                access_token_secret: access_token_secret
            });

            client.post('statuses/update', {status: text}, function (error, tweet, response) {
                if (!error) {
                    callback(error, tweet, response);
                } else {
                    logger.log(error);
                }
            });
        } else {
            logger.debug("Twitter bad config");
        }
    });
}