/**
 * @constructor
 * @param {object} images
 * - Keys are names to give to images
 * - Values are the image srcs
 * @param {function} callback
 * - first argument is object whose keys are image names and values are the
 *   images
 */
function ImageLoader(images, callback) {
	this.callback = callback;

	this.totalImages = Object.keys(images).length;
	this.imagesLoaded = 0;

	this.result = {};

	this.doneLoading = false;

	for (var name in images) {
		var img = new Image();

		img.addEventListener('load', function() {
			this.loader.imagesLoaded += 1;

			this.loader.result[this.name] = this;

			this.loader.check();
		});

		img.loader = this;
		img.name = name;
		img.src = images[name];
	}
}

/*
 * Check if all images have loaded. Call callback if yes
 */
ImageLoader.prototype.check = function() {
	if (!this.doneLoading && this.totalImages == this.imagesLoaded) {
		this.doneLoading = true;

		this.callback(this.result);
	}
}

export default ImageLoader;
