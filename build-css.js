/**
 * Pass -p option to this script to produce minified css instead
 */

const fs = require('fs');
var postcss = require('postcss');

////////// Config

var inputFile = './src/styles/style.css';

var outputLocation =    './prep/final.css';
var outputLocationMin = './prep/final.min.css';

//////////

var minify = process.argv.indexOf('-p') != -1;

/**
 * Returns a promise that handles the css
 * @param {string} outputLocation
 * @param {array of require calls} plugins
 */
function handleCSS(outputLocation, plugins) {
	return new Promise(function(resolve, reject) {
		fs.readFile(inputFile, 'utf-8', function(err, css) {
			if (err) reject(err);

			resolve(css);
		});
	})
	.then(function(css) {
		var processor = postcss(plugins);

		return processor.process(css);
	})
	.then(function(result) {
		return new Promise(function(resolve, reject) {
			fs.writeFile(outputLocation, result.css, function(err) {
				if (err) reject(err);

				console.log("CSS built");

				resolve();
			});
		});
	});
}

if (minify) {
	console.log("Minifying CSS");

	handleCSS(
		outputLocationMin,
		[
			require('postcss-advanced-variables'),
			require('cssnano')
		]
	);
}
else {
	handleCSS(
		outputLocation,
		[
			require('postcss-advanced-variables')
		]
	);
}
