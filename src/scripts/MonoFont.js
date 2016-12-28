import Spriter from './Spriter';
import setImageSmoothing from './setImageSmoothing';

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
 * @param {string[]} mapRows - where the characters are
 */
function MonoFont(image, origin, size, margin, mapRows) {
	this.image = image;
	this.origin = origin;
	this.size = size;
	this.margin = margin;

	this.map = {};

	for (var r = 0; r < mapRows.length; r += 1) {
		var currentRow = mapRows[r];

		for (var c = 0; c < currentRow.length; c += 1) {
			var key = currentRow[c];

			this.map[key] = {x: c, y: r};
		}
	}

	this.spriter = new Spriter(this.image, this.origin, this.size, this.margin, this.map);

	// console.log(this.map);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} char - ? is drawn for unknown characters
 */
MonoFont.prototype.drawChar = function(ctx, char) {
	ctx.save();

	setImageSmoothing(ctx, false);

	try {
		this.spriter.drawSprite(ctx, char);
	}
	catch (err) {
		this.spriter.drawSprite(ctx, '?');
	}

	ctx.restore();
};

/**
 * Draw single-line string
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} string
 */
MonoFont.prototype.drawString = function(ctx, string) {
	ctx.save();
		for (var i = 0; i < string.length; i += 1) {
			this.drawChar(ctx, string[i]);

			ctx.translate(this.size.x + this.margin.x, 0);
		}
	ctx.restore();
};

/**
 * Get dimensions of single-line string
 * @param {string} string
 * @returns {object}
 */
MonoFont.prototype.getStringSize = function(string) {
	return {
		width: string.length * this.size.x + (string.length - 1) * this.margin.x,
		height: this.size.y
	}
};

export default MonoFont
