var fse = require('fs-extra');

var target = process.argv[2];

if (target == undefined) {
	console.log("No directory specified. Nothing changed.")
}
else {
	fse.emptyDir(target, function (err) {
		if (err) {
			console.log(err);
		}
		else {
			console.log(`${target} emptied`);
		}
	});
}
