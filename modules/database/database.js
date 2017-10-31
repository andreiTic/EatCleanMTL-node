var logger = require("./../logger/logger");
var mongodb = require('mongodb');
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var date = require('date-and-time');
date.locale('fr');

// Connection URL
//var url = 'mongodb://dbuser:password123@ds033337.mongolab.com:33337/dbNAME';
var instanceMongoDB;

function getConnection(callback) {
    if (instanceMongoDB) {
        callback(null, instanceMongoDB);
    } else {
        var server = new mongodb.Server("localhost", 27017, {auto_reconnect: true});
        // var server = new mongodb.Server("123.mongolab.com", 33337, {auto_reconnect: true});
        var db = new mongodb.Db("dbNAME", server, {safe: true});

        // if (!db.openCalled) {
        //     db.open(function (err, db) {
        //         if (err) {
        //             callback(err);
        //         }
        //
        //         db.authenticate('dbuser', 'password123', function (err, result) {
        //             assert.equal(true, result);
        //
        //             instanceMongoDB = db;
        //             callback(err, instanceMongoDB);
        //         });
        //     });
        // }
    }
}

var contrevenantExist = function (contrevenant, callback) {
    getConnection(function (err, dbConnection) {
        var collection = dbConnection.collection('contrevenants');
        logger.debug("is Contrevenants exist: " + JSON.stringify(contrevenant));
        collection.findOne(contrevenant, function (err, result) {
            callback(contrevenant, result);
        });
    });
};

var formatContrevenantDates = function (contrevenant) {
    logger.debug("formatContrevenantDates: " + JSON.stringify(contrevenant));
    var format = 'DD MMMM YYYY';
    contrevenant["date_jugement"] = formatDate(contrevenant["date_jugement"], format);
    contrevenant["date_infraction"] = formatDate(contrevenant["date_infraction"], format);

    return contrevenant;
};

exports.insertContrevenants = function (listContrevenant, callback) {
    getConnection(function (err, dbConnection) {
        var collectionContrevenants = dbConnection.collection('contrevenants');
        var collectionNewContrevenants = dbConnection.collection('newContrevenants');

        collectionNewContrevenants.drop();

        var contrevenantArray = [];
        listContrevenant.forEach(function (contrevenant) {
            contrevenant = formatContrevenant(contrevenant);
            contrevenantExist(contrevenant, function (contrevenant, result) {
                if (result == null) {
                    logger.debug("Contrevenant does not exist: " + result + " " + JSON.stringify(contrevenant));

                    collectionContrevenants.insertOne(contrevenant, function (err, result) {
                    });
                    collectionNewContrevenants.insertOne(contrevenant, function (err, result) {
                    });

                    contrevenantArray[contrevenant] = true;
                } else {
                    logger.debug("Contrevenant exist: " + JSON.stringify(contrevenant));
                    contrevenantArray[contrevenant] = false;
                }
            });
        });

        callback(contrevenantArray);
    });
};

var find = function (params, callback) {
    getConnection(function (err, dbConnection) {
        var collection = dbConnection.collection('contrevenants');
        logger.debug("find looking for: " + JSON.stringify(params));

        collection.find(params).toArray(function (err, result) {
            logger.debug("found : " + JSON.stringify(result));

            callback(err, result);
        });
    });
};

exports.find = function (params, callback) {
    find(params, callback);
};

var formatContrevenantEtablissement = function (contrevenant) {
    contrevenant["etablissement"] = contrevenant["etablissement"].replace(/\s+/g, ' ');
    return contrevenant;
};

var formatContrevenant = function (contrevenant) {
    contrevenant = formatContrevenantDates(contrevenant);
    contrevenant = formatContrevenantEtablissement(contrevenant);
    return contrevenant;
};

var formatDate = function (dateToFormat, format) {
    logger.debug("formatDate : " + dateToFormat);

    return date.parse(dateToFormat, format);
};

exports.findBetween = function (from, to, callback) {
    var format = 'YYYY-MM-DD';

    logger.debug("findBetween : " + from + " and " + to);
    if(date.isValid(from,format) && date.isValid(from,format)){
        find({"date_infraction": {"$gte": formatDate(from, format), "$lt": formatDate(to, format)}}, callback);
    }else{
        callback(true);
    }
};

exports.findByName = function (name, callback) {
    logger.debug("findByName : ", name);

    find({"etablissement": name}, callback);
};

exports.findByID = function (id, callback) {
    logger.debug("findByID : ", id);

    find({"_id": ObjectId(id)}, callback);
};

exports.getListEtablissement = function (callback) {
    getConnection(function (err, dbConnection) {

        var collection = dbConnection.collection('contrevenants');
        collection.distinct("etablissement", function (err, result) {
            assert.equal(err, null);
            logger.debug("getListEtablissement : " + result);
            callback(result);
        });
    });
};

exports.getListNewContrevenant = function (callback) {
    getConnection(function (err, dbConnection) {

        var collection = dbConnection.collection('newContrevenants');
        collection.distinct("etablissement", function (err, result) {
            assert.equal(err, null);
            logger.debug("getListNewContrevenant : " + result);
            callback(result);
        });
    });
};

exports.getContrevenantsListDesc = function (callback) {
    getConnection(function (err, dbConnection) {

        var collection = dbConnection.collection('contrevenants');

        collection.aggregate([
            {$group: {_id: "$etablissement", Infractions: {"$sum": 1}}},
            {$sort: {Infractions: -1}},
            {$project: {Nom: "$_id", Infractions: 1, _id: 0}}
        ]).toArray(
            function (err, results) {
                assert.equal(err, null);
                logger.debug("getContrevenantsListDesc : " + results);
                callback(results);
            }
        );
    });
};

exports.updateContreveneant = function (contreveantId, contrevenant, callback) {
    getConnection(function (err, dbConnection) {
        console.log(contreveantId);

        var collection = dbConnection.collection('contrevenants');

        collection.updateOne(
            {_id: ObjectId(contreveantId)},
            {
                $set: {
                    "montant": contrevenant.montant,
                    "proprietaire": contrevenant.proprietaire,
                    "categorie": contrevenant.categorie,
                    "etablissement": contrevenant.etablissement,
                    "adresse": contrevenant.adresse,
                    "ville": contrevenant.ville,
                    "description": contrevenant.description,
                    "date_infraction": contrevenant.date_infraction,
                    "date_jugement": contrevenant.date_jugement
                }
            },
            function (err, result) {
                logger.debug("update : " + result);
                callback(err, result);
            });
    });
};

exports.deleteContrevenant = function (contrevenantId, callback) {
    getConnection(function (err, dbConnection) {

        var collection = dbConnection.collection('contrevenants');
        console.log("id:" + contrevenantId);
        collection.removeOne(
            {
                _id: ObjectId(contrevenantId)
            },
            function (err, result) {
                assert.equal(err, null);
                logger.debug("delete : " + result);
                callback(result);
            });
    });
};

var subscriberExist = function (subscriber, callback) {
    getConnection(function (err, dbConnection) {
        var collection = dbConnection.collection('subscribers');
        logger.debug("is Subscriber exist: " + JSON.stringify(subscriber));
        collection.findOne({'email': subscriber.email}, function (err, result) {
            callback(subscriber, result);
        });
    });
};


//TODO: Find if user exists
exports.addSubscriber = function (subscriber, callback) {
    getConnection(function (err, dbConnection) {
        var collectionSurveillance = dbConnection.collection('subscribers');
        subscriberExist(subscriber, function (subscriber, result) {
            if (result == null) {
                logger.debug("Subscriber does not exist: " + result + " " + JSON.stringify(subscriber));

                collectionSurveillance.insertOne(subscriber, function (err, result) {
                    assert.equal(err, null);
                    logger.debug("Subscriber added: " + JSON.stringify(subscriber));
                    callback(err, result);
                });

            } else {
                logger.debug("Contrevenant exist: " + JSON.stringify(subscriber));
                callback(err, null);
            }
        });
    });
};

exports.getListSurveillant = function (callback) {
    getConnection(function (err, dbConnection) {

        var collection = dbConnection.collection('subscribers');
        collection.find({}).toArray(function (err, result) {
            assert.equal(err, null);
            logger.debug("getListSurveillant : " + result);
            callback(result);
        });
    });
};

exports.deleteSubscriber = function (followerId, callback) {
    getConnection(function (err, dbConnection) {

        var collection = dbConnection.collection('subscribers');
        collection.removeOne(
            {
                _id: ObjectId(followerId)
            },null,
            function (err, result) {
                assert.equal(err, null);
                logger.debug("delete : " + result);
                callback(err, result);
            });
    });
};