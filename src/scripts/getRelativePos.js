/**
 * Get pos relative to element
 * @param {object} pos
 * @property {number} pos.x
 * @property {number} pos.y
 * @param {HTML element} element
 * @returns {object}
 */
export default function(pos, element) {
	return {
		x: (pos.x - element.offsetLeft) / element.offsetHeight,
		y: (pos.y - element.offsetTop) / element.offsetHeight
	};
};
