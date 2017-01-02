/**
 * @param {Event} e
 */
export default function(e) {
	// console.log(e);

	var target = e.touches[0] || e.changedTouches[0];

	return {
		x: target.pageX,
		y: target.pageY
	};
}
