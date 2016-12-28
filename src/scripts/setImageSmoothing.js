/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {boolean} value
 */
export default function(ctx, value) {
	ctx.mozImageSmoothingEnabled = value;
	ctx.webkitImageSmoothingEnabled = value;
	ctx.msImageSmoothingEnabled = value;
	ctx.imageSmoothingEnabled = value;
}
