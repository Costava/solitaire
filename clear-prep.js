var fse = require('fs-extra')

fse.emptyDir('./prep', function (err) {
	if (err) {
		console.log(err)
	}
	else {
		console.log("prep directory cleared")
	}
})
