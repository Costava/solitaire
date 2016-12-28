/**
 * Outputs the data uri of the image
 * Usage: `node encode.js path/to/image.png`
 */

const DataURI = require('datauri');
const datauri = new DataURI();

datauri.encode(process.argv[2], (err, content) => {
	if (err) {
			throw err;
	}

	console.log(content);
});
