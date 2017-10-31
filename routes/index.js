var express = require('express');
var router = express.Router();
var database = require("../modules/database/database");
var logger = require("../modules/logger/logger");
var schemas = require('./../modules/schemas/schemas');
var raml2html = require('raml2html');
var path = require('path');
var contrevenantsParser = require('../modules/parser/contrevenantsParser');
var Validator = require('jsonschema');
var EasyXml = require('easyxml');
var json2csv = require('json2csv');
var mailer = require('../modules/notifications/email');
var date = require('date-and-time');
var twitter = require("../modules/notifications/twitter");

/**
 * Routes de test des cronjobs
 *
 * Envoi email abbonées     : /mail
 * Importation des données  : /fetch
 * Envoi email dans yaml    : /mailyaml
 * Envoi des tweets         : /tweet
 */
router.get('/mail', function (req, res, next) {
    mailer.sendSubscriberContrevant();
    res.sendStatus(200);
});

router.get('/fetch', function (req, res, next) {
    contrevenantsParser.parseAndUpdateContrevenant();
    res.sendStatus(200);
});

router.get('/mailyaml', function (req, res, next) {
    mailer.sendListNewContrevenant();
    res.sendStatus(200);
});

router.get('/tweet', function (req, res, next) {
    twitter.tweetListNewContrevenant();
    res.sendStatus(200);
});
/*Fin routes test*/

router.get('/', function (req, res, next) {
    database.getListEtablissement(function (result) {
        res.render('contrevenantSearch', {title: 'Recherche', proprietaires: result});
    });
});

router.get('/doc', function (req, res, next) {
    var config = raml2html.getDefaultConfig(false);
    var filePath = path.join(__dirname, "../raml/doc.raml");

    var onError = function (err) {
        logger.log(err);
        res.sendStatus(500);
    };

    var onSuccess = function (html) {
        res.send(html);
    };

    raml2html.render(filePath, config).then(onSuccess, onError);
});

router.get('/api/search/contrevenants/date', function (req, res, next) {
    var from = req.query.du;
    var to = req.query.au;

    database.findBetween(from, to, function (err, result) {
        if (err) {
            res.sendStatus(404);
        } else {
            res.jsonp(result);
        }
    });
});

router.get('/api/search/contrevenants/nom', function (req, res, next) {
    var nom = req.query.nom;
    database.findByName(nom, function (err, result) {
        if (err) {
            res.sendStatus(404);
        } else {
            res.jsonp(result);
        }
    });
});


router.get('/api/search/contrevenants/id', function (req, res, next) {
    var id = req.query.id;
    database.findByID(id, function (err, result) {
        if (err) {
            res.sendStatus(404);
        } else {
            res.jsonp(result);
        }
    });
});

router.get('/api/search/contrevenants/list/:format', function (req, res, next) {
    var format = req.params.format.toLocaleLowerCase();

    if (format == "xml") {
        var serializer = new EasyXml({
            singularize: true,
            rootElement: 'response',
            dateFormat: 'ISO',
            manifest: true,
            rootArray: 'Etablissement'
        });
        database.getContrevenantsListDesc(function (result) {
            res.setHeader('content-type', 'text/xml');
            res.send(serializer.render(result));
        });
    } else if (format == "json") {
        database.getContrevenantsListDesc(function (result) {
            res.jsonp(result);
        });
    } else if (format == "csv") {
        database.getContrevenantsListDesc(function (result) {
            var fields = ['Infractions', 'Nom'];
            res.setHeader('content-type', 'text/csv');
            res.send(json2csv({data: result, fields: fields}));
        });
    } else {
        res.sendStatus(400);
    }
});

router.put("/contrevenant/:id", function (req, res, next) {
    var contrevenantJSON = req.body;

    var format = 'YYYY-MM-DD';
    contrevenantJSON["date_infraction"] = date.parse(contrevenantJSON["date_infraction"], format);
    contrevenantJSON["date_jugement"] = date.parse(contrevenantJSON["date_jugement"], format);

    var validatorRes = Validator.validate(contrevenantJSON, schemas.contrevenantSchema);

    if (validatorRes.errors.length > 0) {
        res.status(400).json(validatorRes.errors);
    } else {
        console.log(validatorRes.valid);
        database.updateContreveneant(req.params.id, contrevenantJSON, function (err, result) {
            if (err) {
                res.sendStatus(500);
            } else if (result.result.n === 0) {
                res.sendStatus(404);
            } else {
                res.status(200).jsonp(contrevenantJSON);
            }
        });
    }
});

router.delete('/contrevenant/:id', function (req, res, next) {
    var contreveantId = req.params.id;
    database.findByID(contreveantId, function (err, result) {
        if (err) {
            res.sendStatus(400);
        } else if (result.length > 0) {
            database.deleteContrevenant(contreveantId, function (result) {
                res.sendStatus(200);
            });
        } else {
            logger.debug("Delete: Not Found");
            res.sendStatus(404);
        }
    });
});

router.get('/subscribe', function (req, res, next) {
    database.getListEtablissement(function (result) {
        res.render('subscribe', {title: "S'abonner", proprietaires: result});
    });
});

router.post('/subscriber', function (req, res, next) {
    var surveillant = req.body.surveillant;
    var surveillantJSON = JSON.parse(surveillant);
    var validatorRes = Validator.validate(surveillantJSON, schemas.survienantSchema);

    if (validatorRes.errors.length > 0) {
        res.status(400).json(validatorRes.errors);
    } else {
        database.addSubscriber(surveillantJSON, function (err, result) {
            console.log(result);
            if (err) {
                res.sendStatus(500);
            } else if (result == null) {
                res.sendStatus(304);
            } else {
                res.status(200).jsonp(surveillantJSON);
            }
        });
    }
});

router.get('/unsubscribe/:id', function (req, res, next) {
    var id = req.params.id;

    res.render('unsubscribe', {title: 'Désabonnment', subscriberId: id});
});

router.delete('/subscriber/:id', function (req, res, next) {
    var id = req.params.id;

    database.deleteSubscriber(id, function (err, result) {
        if (err) {
            res.sendStatus(500);
        } else if (result.result.n === 0) {
            res.sendStatus(404);
        } else {
            res.status(200).jsonp(result);
        }
    });
});

module.exports = router;