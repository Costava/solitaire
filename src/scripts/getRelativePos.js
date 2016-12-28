/**
 * Get position of event e relative to element
 * @returns {object}
 */
export default function(e, element) {
	return {
		x: (e.pageX - element.offsetLeft) / element.offsetHeight,
		y: (e.pageY - element.offsetTop) / element.offsetHeight
	};
};
