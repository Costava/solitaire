/**
 * Pass -p option to this script to produce minified bundle instead
 * Usage: node build-js.js
 *        node build-js.js -p
 */

var webpack = require('webpack');
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');
__dirname
////////// Config

var entry = './src/scripts/main.js';

var output = {
	path: __dirname + '/prep',
	filename: 'bundle.js'
};

var plugins = null;

var outputMin = {
	path: __dirname + '/prep',
	filename: 'bundle.min.js'
};

var pluginsMin = [
	new webpack.optimize.OccurrenceOrderPlugin()
]

//////////

var minify = process.argv.indexOf('-p') != -1;

var webpackConfigModule = {
	rules: [
		{
			test: /\.js$/,
			loader: 'babel-loader',
			query: {
				presets: ['@babel/preset-env']
			}
		}
	]
};

function handleJS(entry, output, plugins) {
	var config = {
		entry: entry,
		mode: 'production',
		output: output,
		module: webpackConfigModule,
		optimization: {
			minimizer: [
				new UglifyJsPlugin()
			]
		}
	};

	if (plugins instanceof Array) {
		config.plugins = plugins;
	}

	var compiler = webpack(config);

	compiler.run(function(err, stats) {
		if (err) {
			console.log(err);
		}
		else {
			console.log(`Bundled ${entry} and outputted to ${output.filename} in ${output.path}`);
		}
	});
}

//////////

if (minify) {
	console.log("Minifying JS bundle");

	handleJS(entry, outputMin, pluginsMin);
}
else {
	handleJS(entry, output, plugins);
}
