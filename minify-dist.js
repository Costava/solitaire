const fs = require('fs');
var fse = require('fs-extra');
var minify = require('html-minifier').minify;

//////////

var target = './dist/index.html';

//////////

var html = fs.readFileSync(target, {encoding: 'utf-8'});

var result = minify(html, {
	removeComments: true,
	collapseWhitespace: true
});

fse.outputFileSync(target, result);

console.log(`Minified ${target}`);
