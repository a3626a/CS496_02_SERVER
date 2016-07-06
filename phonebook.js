var http = require('http');
var url = require('url');

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mUrl = 'mongodb://127.0.0.1:27017/test';

var insertDocument = function(db, json, callback) {
	db.collection('phonebook').insertOne(
			json, 
			function(err, result) {
				assert.equal(err, null);
				console.log("[Post]Inserted a document into the phonebook collection.");
				callback();
				});
	};

const server = http.createServer((req,res) => {
	var data = '';
	var verb = req.method;
	if (verb == 'POST') {
		var path = url.parse(req.url).pathname;
		path = decodeURIComponent(path.substring(1));
		req.on('data',(chunk) => {
			data += chunk.toString();
			console.log('[POST]CHUNK : '+chunk.toString());
		});
		req.on('end',() => {
			var json = JSON.parse(data);
			MongoClient.connect(mUrl, function(err, db) {
				assert.equal(null, err);
				db.collection('phonebook').replaceOne({'name':path},{'name':path,'phonebook':json},null,function(err, result) {
					if (JSON.parse(result).n==0) {
						insertDocument(db, {'name':path,'phonebook':json}, function() {
							db.close();
							res.setHeader('Content-Type', 'text/plain');
							res.writeHead(200);
							res.write('Insert the document of the phonebook collection.');
							res.end();
							console.log('[Post]Redsponsed Insert');
						});
					} else {
						db.close();
						res.setHeader('Content-Type', 'text/plain');
						res.writeHead(200);
						res.write('Fetch the document of the phonebook collection.');
						res.end();
						console.log('[Post]Redsponsed Fetch');
					}
				})
			});
		});
	} 
	else if (verb == 'GET') {
		var path = url.parse(req.url).pathname;
		path = decodeURIComponent(path.substring(1));
		console.log('[GET]Request URL: ' + req.url);
		console.log('[GET]Request pathname: ' + path);
		MongoClient.connect(mUrl, function(err, db) {
			assert.equal(null, err);
			db.collection('phonebook').findOne({"name":path}, function (err, result) {
				if (result != null) {
					db.close();
					res.setHeader('Content-Type', 'text/plain');
					res.writeHead(200);
					res.write(JSON.stringify(result.phonebook));
					res.end();
					console.log('[GET]Responsed : ');
				} else {
					db.close();
					res.setHeader('Content-Type', 'text/plain');
					res.writeHead(200);
					res.write('[]');
					res.end();
					console.log('[GET]Responsed : ');
				}
			});
		});
	}
});
server.listen(8080);