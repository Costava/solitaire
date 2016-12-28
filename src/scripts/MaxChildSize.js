/**
 * @param {number} childAspectWidth
 * @param {number} childAspectHeight
 * - Width/Height == aspect ratio
 * - Width and Height should be integers
 * @param {number} parentWidth - generic unit
 * @param {number} parentHeight - generic unit
 * @returns {object}
 *  - has `width` and `height` properties of max size of child
 *    having childAspectWidth/Height aspect ratio
 *    inside parent with parentWidth and Height dimensions
 */
export default function(childAspectWidth, childAspectHeight, parentWidth, parentHeight) {
	if (parentWidth <= 0 || parentHeight <= 0) {
		return {width: 0, height: 0};
	}
	else if ((childAspectWidth < 0 || childAspectHeight < 0) || (childAspectWidth === 0 && childAspectHeight === 0)) {
		return {width: 0, height: 0};
	}
	else if (childAspectWidth === 0) {
		return {width: 0, height: parentHeight};
	}
	else if (childAspectHeight === 0){
		return {width: parentWidth, height: 0};
	}

	// else:
	//  childAspectWidth & Height > 0
	//  parentWidth & Height      > 0

	// console.log(
	// 	`childAspectWidth: ${childAspectWidth}, ` +
	// 	`childAspectHeight: ${childAspectHeight}, ` +
	// 	`parentWidth: ${parentWidth}, ` +
	// 	`parentHeight: ${parentHeight}`
	// );

	var width, height;
	var childAspectRatio = childAspectWidth / childAspectHeight;
	var parentAspectRatio = parentWidth / parentHeight;

	if (childAspectRatio === parentAspectRatio) {
		width = parentWidth;
		height = parentHeight;
	}
	else if (childAspectRatio < parentAspectRatio) {
		var scale = Math.floor(parentHeight / childAspectHeight);

		width = scale * childAspectWidth;
		height = scale * childAspectHeight;
	}
	else if (childAspectRatio > parentAspectRatio) {
		var scale = Math.floor(parentWidth / childAspectWidth);

		width = scale * childAspectWidth;
		height = scale * childAspectHeight;
	}
	else {
		console.log(
			`Unknown MaxChildSize condition. ` +
			`childAspectWidth: ${childAspectWidth}, ` +
			`childAspectHeight: ${childAspectHeight}, ` +
			`parentWidth: ${parentWidth}, ` +
			`parentHeight: ${parentHeight}`
		);
	}

	return {width: width, height: height};
}
