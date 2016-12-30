/**
 * Embed CSS and JS in an HTML file
 * HTML file path must be first argument. Output file is second.
 * Specifying CSS and JS is optional and either can be specified first
 * Usage:
 * node embed.js index.html output.html --css style.css style2.css --js script.js script2.js
 */

const fs = require('fs');
var fse = require('fs-extra');

//////////

var htmlReg = /.html$/;
var cssReg = /.css$/;
var jsReg = /.js$/;

//////////

// Cut off node and script file path
var args = process.argv.slice(2);

////////// Check if input file is .html and open it

var inputHTMLFilePath = args[0];

var inputIsHTMLFile = htmlReg.test(inputHTMLFilePath);

if (!inputIsHTMLFile) {
	console.log(`Error: Input file is not HTML: ${htmlFilePath}`);

	return 1;
}

var html = fs.readFileSync(inputHTMLFilePath, {encoding: 'utf-8'});

var outputLocation = args[1];

//////////

var cssOptionIndex = args.indexOf('--css');

if (cssOptionIndex != -1) {
	var cssFilePaths = [];

	// Get all CSS file paths
	for (var i = cssOptionIndex + 1; i < args.length; i += 1) {
		var current = args[i];

		// Break if begin specifying something else
		if (current.substr(0, 2) == '--') {
			break;
		}

		if (!cssReg.test(current)) {
			console.log(`WARNING: File may not be CSS: ${current}`);
		}

		cssFilePaths.push(current);
	}

	// console.log(`CSS files: ${cssFilePaths}`);

	// Embed CSS files
	for (var i = 0; i < cssFilePaths.length; i += 1) {
		var current = cssFilePaths[i];

		console.log(`Embedding ${current} in ${inputHTMLFilePath}`);

		var css = fs.readFileSync(current, {encoding: 'utf-8'});

		html = html.replace(
			/^(\t*)<\/head>/m,
			`$1\t<style>\n${css}\n$1\t</style>\n$1</head>`
		);

		// console.log(html);
	}
}

//////////

var jsOptionIndex = args.indexOf('--js');

if (jsOptionIndex != -1) {
	var jsFilePaths = [];

	// Get all JS file paths
	for (var i = jsOptionIndex + 1; i < args.length; i += 1) {
		var current = args[i];

		// Break if begin specifying something else
		if (current.substr(0, 2) == '--') {
			break;
		}

		if (!jsReg.test(current)) {
			console.log(`WARNING: File may not be JS: ${current}`);
		}

		jsFilePaths.push(current);
	}

	// console.log(`JS files: ${jsFilePaths}`);

	// Embed JS files
	for (var i = 0; i < jsFilePaths.length; i += 1) {
		var current = jsFilePaths[i];

		console.log(`Embedding ${current} in ${inputHTMLFilePath}`);

		var js = fs.readFileSync(current, {encoding: 'utf-8'});

		html = html.replace(
			/^(\t*)<\/body>/m,
			`$1\t<script>\n${js}\n$1\t</script>\n$1</body>`
		);

		// console.log(html);
	}
}

//////////

fse.outputFileSync(outputLocation, html);

console.log(`HTML file with embeds output to ${outputLocation}`);
