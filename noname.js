var http = require('http');
var url = require('url');

const server = http.createServer((req,res) => {
	  res.setHeader('Content-Type', 'text/html');
	  res.setHeader('X-Foo', 'bar');
	  res.writeHead(200, {'Content-Type': 'text/plain'});
	  res.end('ok');
	});
server.listen(8080);