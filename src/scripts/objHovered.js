/**
 * Returns whether obj is hovered by thing at pos
 * @param {object} obj
 * @property {number} obj.x
 * @property {number} obj.y
 * @property {number} obj.width
 * @property {number} obj.height
 * @param {object} pos
 * @property {number} pos.x
 * @property {number} pos.y
 * @returns {boolean}
 */
export default function(obj, pos) {
	if (pos.x > obj.x && pos.y > obj.y) {
		var xAmount = pos.x - obj.x;
		var yAmount = pos.y - obj.y;

		if (xAmount < obj.width && yAmount < obj.height) {
			return true;
		}
	}

	return false;
}
