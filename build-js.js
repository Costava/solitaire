/**
 * Pass -p option to this script to produce minified bundle instead
 * Usage: node build-js.js
 *        node build-js.js -p
 */

var webpack = require('webpack');

////////// Config

var entry = './src/scripts/main.js';

var output = {
	path: './prep',
	filename: 'bundle.js'
};

var plugins = null;

var outputMin = {
	path: './prep',
	filename: 'bundle.min.js'
};

var pluginsMin = [
	new webpack.optimize.UglifyJsPlugin(),
	new webpack.optimize.OccurrenceOrderPlugin()
]

//////////

var minify = process.argv.indexOf('-p') != -1;

var webpackConfigModule = {
	loaders: [
		{
			test: /\.js$/,
			loader: 'babel-loader',
			query: {
				presets: ['es2015']
			}
		}
	]
};

function handleJS(entry, output, plugins) {
	var config = {
		entry: entry,
		output: output,
		module: webpackConfigModule
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
