var http = require('http');
var url = require('url');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mUrl = 'mongodb://127.0.0.1:27017/test';

var insertDocument = function(db, json, callback) {
	db.collection('gallery').insertOne(
			json, 
			function(err, result) {
				assert.equal(err, null);
				callback();
				});
	};
var findDocument = function(db, name, callback) {
	var cursor = db.collection('phonebook').find({"name":name});
	var jarray = JSON.parse('[]');
	cursor.each(function(err, doc) {
		assert.equal(err, null);
		if (doc != null) {
			jarray.push(doc)
			console.log('[GET]'+JSON.stringify(doc));
			} 
		else {
			callback(JSON.stringify(jarray));
			}
		});
	};	 

const server = http.createServer((req,res) => {
	var data = '';
	var verb = req.method;
	if (verb == 'POST') {
		var path = url.parse(req.url).pathname;
		console.log('[POST]Request : ['+path+']');
		path = decodeURIComponent(path.substring(1));
		var split = path.split('/');
		var name = split[0];
		var filename = split[1];
		MongoClient.connect(mUrl, function(err, db) {
			assert.equal(null, err);
			var bucket = new mongodb.GridFSBucket(db);
			var stream = bucket.openUploadStream(filename);
			var id = stream.id;
			req.pipe(stream).on('finish', function() {
				db.collection('gallery').findOne({'name':name}, function(err, result) {
					if (result == null) {
						insertDocument(db, {'name':name,'photo':[id]}, function() {
							db.close();
							res.setHeader('Content-Type', 'text/plain');
							res.writeHead(200);
							res.write('Create new document with name [' + name + ']');
							res.end();
							console.log('Create new document with name [' + name + ']');
						});
					} else {
						db.collection('gallery').updateOne({'name':name},{$push:{photo:id}},function(err, result) {
							db.close();
							res.setHeader('Content-Type', 'text/plain');
							res.writeHead(200);
							res.write('Inserted the photo ['+filename+'] into the gallery of ['+name+']');
							res.end();
							console.log('Inserted the photo ['+filename+'] into the gallery of ['+name+']');
						});
					}
				})
			});
		});
	} 
	else if (verb == 'GET') {
		var path = url.parse(req.url).pathname;
		path = decodeURIComponent(path.substring(1));
		var split = path.split('/');
		var name = split[0];
		if (split[1] == 'length') {
			MongoClient.connect(mUrl, function(err, db) {
				assert.equal(null, err);
				db.collection('gallery').findOne({'name':name},function(err, result) {
					if (result != null) {
						res.setHeader('Content-Type', 'text/plain');
						res.writeHead(200);
						var buf = new Buffer(1)
						buf[0] = result.photo.length;
						res.write(buf);
						res.end();
						console.log('Return the gallery size ['+buf[0]+']');
						db.close();
					} else {
						res.setHeader('Content-Type', 'text/plain');
						res.writeHead(200);
						var buf = new Buffer(1)
						buf[0] = 0;
						res.write(buf);
						res.end();
						console.log('Return the gallery size ['+0+']');
						db.close();
					}
				});
			});
		} else {
			console.log('[GET]Request : ['+path+']');
			var pos = parseInt(split[1]);
			MongoClient.connect(mUrl, function(err, db) {
				assert.equal(null, err);
				db.collection('gallery').findOne({'name':name},function(err, result) {
					if (result != null) {
						var bucket = new mongodb.GridFSBucket(db);
						res.setHeader('Content-Type', 'text/plain');
						res.writeHead(200);
						bucket.openDownloadStream(result.photo[pos]).pipe(res).on('finish', function() {
							res.end();
							console.log('Retrieve the ['+pos+']th photo of ['+name+']');
							db.close();
						});
					} else {
						res.writeHead(200);
						res.write('');
						res.end();
						console.log('Invalid photo request for non existence document');
						db.close();
					}
				});
			});
		}
	}
});
server.listen(8081);