var xml2js = require('xml2js');
var parser = new xml2js.Parser({explicitArray: false});
var request = require('request'), iconv = require('iconv-lite');
var logger = require("./../logger/logger");

var database = require("./../database/database");

parser.on('error', function (err) {
    logger.debug('Parser error', err);
});

var insertContrevenants = function (xml, callback) {
    var listContrevenant = xml["contrevenants"]["contrevenant"];
    logger.debug('insertContrevenants', xml);
    database.insertContrevenants(listContrevenant, callback);
};

var getContrevenantsXML = function (callback) {
    var url = 'http://donnees.ville.montreal.qc.ca/dataset/a5c1f0b9-261f-4247-99d8-f28da5000688/resource/92719d9b-8bf2-4dfd-b8e0-1021ffcaee2f/download/inspection-aliments-contrevenants.xml';
    request({url: url, encoding: null}, function (error, response, html) {
        if (error == null) {
            logger.debug('getContrevenantsXML HTML', html);
            var encodedHTML = iconv.decode(html, 'ISO-8859-1');
            logger.debug('getContrevenantsXML decoded XML', encodedHTML);
            callback(encodedHTML);
        }
    });
};

var stringToXML = function (string, callback) {
    logger.debug('stringToXML res', string);
    parser.parseString(string, function (err, result) {
        logger.debug('stringToXML res', result);
        callback(result);
    });
};

exports.parseAndUpdateContrevenant = function (callback) {
    getContrevenantsXML(function (string) {
        stringToXML(string, function (xml) {
            insertContrevenants(xml, function (res) {
                callback(res);
            });
        });
    });
};
