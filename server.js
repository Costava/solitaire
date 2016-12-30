/**
 * Simple node server. Always returns the HTML file at TARGET.
 * After starting, visit <my local IP>:8080
 */

const http = require('http');
const fs = require('fs');

const PORT = 8080;
const TARGET = './dist/index.html';

var requests = 0;

const server = http.createServer((req, res) => {
	var html = fs.readFileSync(TARGET, {encoding: 'utf-8'});

	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/html');
	res.end(html);

	requests += 1;

	console.log(`Answered request ${requests} at ${new Date().toLocaleString()}`);
});

server.listen(PORT, () => {
	console.log(`Server running at port ${PORT}`);
	console.log(`Press ctrl + c to stop server\n`);
});
