/**
 * Creates a file that gives an ES6 export of an object whose keys are
 *  the file names of images and the values are the data uris of them
 */

const DataURI = require('datauri');
const fse = require('fs-extra');

////////// Config

var inputDir = 'src/img';
var outputFile = 'src/scripts/ImageURIs.js';

var isImageRegex = /.png$/;

//////////

// Keys are file names
// Values are data uris of the images
var uris = {};

fse.walk(inputDir)
	.on('data', function(item) {
		var path = item.path;

		// path may be the path of a directory
		var isImage = isImageRegex.test(path);

		if (isImage) {
			// Get data uri of image
			var data = DataURI.sync(path);

			// Get file name
			var fileName = /[\/\\]([^\/\\]+)$/.exec(path)[1];

			// Slice off file type
			var key = fileName.slice(0, fileName.length - 4);

			uris[key] = data;
		}
	})
	.on('end', function() {
		var text = 'export default ' + JSON.stringify(uris, null, '\t');

		fse.outputFile(outputFile, text, function(err) {
			if (err) {
				console.log(err);
			}
			else {
				console.log(`${outputFile} was updated with images in ${inputDir}`);
			}
		})
	})
