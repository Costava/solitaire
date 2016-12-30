/**
 * Outputs the data uri of the file
 * Usage: `node encode.js path/to/image.png`
 */

const DataURI = require('datauri');
const datauri = new DataURI();

var target = process.argv[2];

if (target == undefined) {
	console.log("No file specified")
}
else {
	datauri.encode(target, (err, content) => {
		if (err) {
			throw err;
		}

		console.log(content);
	});

}
