var database = require("./../database/database");
var yamlConfig = require('./config');
var nodemailer = require('nodemailer');
var logger = require("./../logger/logger");

var configkeys = ["service", "username", "password", "emailList", "enabled", "emailSubject"];

exports.sendListNewContrevenant = function () {
    database.getListNewContrevenant(function (result) {
        var email = "Voici la liste des nouveaux contrevenants:\n";

        if (result) {
            for (var i = 0; i < result.length; ++i) {
                email += result[i] + "\n";
            }
            sendListNewContrevenantEmail(email, function (error, info) {
                if (error) {
                    logger.debug(error);
                } else {
                    logger.debug('Message sent: ' + info.response);
                }
            });
        }
    });
};

function sendListNewContrevenantEmail(text, callback) {
    yamlConfig.getConfigs("email", configkeys, function (config) {
        if (config) {
            var service = config["service"];
            var username = config["username"];
            var password = config["password"];
            var emailList = config["emailList"];
            var subject = config["emailSubject"];
            var enabled = config["enabled"];

            if (!enabled) {
                logger.info("Email is not enabled");
                return;
            }

            sendEmail(service, username, password, text, emailList, subject, callback);
        } else {
            logger.debug("Email bad config");
            callback(true, "Email bad config");
        }
    });
}

//TODO: accents
exports.sendSubscriberContrevant = function () {
    database.getListNewContrevenant(function (listeContrevenants) {
        database.getListSurveillant(function (listSurveillant) {
            for (var i = 0; i < listSurveillant.length; i++) {
                var surveillant = listSurveillant[i];

                //TODO: Dans la vrai vie... utiliser un generateur de URL.
                var email = "Voici la liste des nouveaux contrevenants que vous surveillez:\n\n " +
                    "Pour vous desabonner: https://fathomless-fortress-55443.herokuapp.com/unsubscribe/" + surveillant._id + "\n";
                for (var j = 0; j < surveillant.listeContrevenants.length; j++) {
                    var contrevenant = surveillant.listeContrevenants[j];

                    if (listeContrevenants.indexOf(contrevenant) > -1) {
                        email += contrevenant + "\n";
                    }
                }
                sendSurveillanceEmail(email, surveillant.email, "Nouveaux contrevenants", function (error, info) {
                    if (error) {
                        logger.debug(error);
                    } else {
                        logger.debug('Message sent: ' + info.response);
                    }
                });
            }
        });
    })
};


function sendSurveillanceEmail(text, to, subject, callback) {
    yamlConfig.getConfigs("email", configkeys, function (config) {
        if (config) {
            var service = config["service"];
            var username = config["username"];
            var password = config["password"];
            var enabled = config["enabled"];

            if (!enabled) {
                logger.info("Email is not enabled");
                return;
            }

            sendEmail(service, username, password, text, to, subject, callback);
        } else {
            logger.debug("Email bad config");
            callback(true, "Email bad config");
        }
    });
}

function sendEmail(service, username, password, text, to, subject, callback) {
    var transporter = nodemailer.createTransport({
        service: service,
        auth: {
            user: username,
            pass: password
        }
    });

    var mailOptions = {
        from: username,
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, function (error, info) {
        callback(error, info);
    });
}
//
// function sendNewContrevenantEmail(text, callback) {
//     yamlConfig.getConfigs("email", configkeys, function (config) {
//         if (config) {
//             var service = config["service"];
//             var username = config["username"];
//             var password = config["password"];
//             var emailList = config["emailList"];
//             var subject = config["emailSubject"];
//             var enabled = config["enabled"];
//
//             if (!enabled) {
//                 logger.info("Email is not enabled");
//                 return;
//             }
//
//             var transporter = nodemailer.createTransport({
//                 service: service,
//                 auth: {
//                     user: username,
//                     pass: password
//                 }
//             });
//
//             var mailOptions = {
//                 from: username,
//                 to: emailList,
//                 subject: subject,
//                 text: text
//             };
//
//             transporter.sendMail(mailOptions, function (error, info) {
//                 callback(error, info);
//             });
//         } else {
//             logger.debug("Email bad config");
//         }
//     });
// }