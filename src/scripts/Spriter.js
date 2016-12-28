/**
 * @constructor
 * @param {Image} image
 * @param {object} origin
 * @property {number} origin.x
 * @property {number} origin.y
 * @param {object} size
 * @property {number} size.x
 * @property {number} size.y
 * @param {object} margin
 * @property {number} margin.x
 * @property {number} margin.y
 * @param {object} map - give names to different sprites in image
 */
function Spriter(image, origin, size, margin, map) {
	this.image = image;
	this.origin = origin;
	this.size = size;
	this.margin = margin;
	this.map = map;
}

/**
 * x and y are zero indexed coords of sprite
 * @param {object} gridLocation
 * @property {number} gridLocation.x
 * @property {number} gridLocation.y
 */
Spriter.prototype.getSpriteOrigin = function(gridLocation) {
	return {
		x: this.origin.x + gridLocation.x * (this.size.x + this.margin.x),
		y: this.origin.y + gridLocation.y * (this.size.y + this.margin.y),
	}
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} sprite
 */
Spriter.prototype.drawSprite = function(ctx, sprite) {
	var gridLocation = this.map[sprite];
	var origin = this.getSpriteOrigin(gridLocation);

	// console.log("gridLocation:", gridLocation);
	// console.log("origin:", origin);

	ctx.drawImage(
		this.image,
		origin.x, origin.y,
		this.size.x, this.size.y,
		0, 0,
		this.size.x, this.size.y
	);
};

export default Spriter
