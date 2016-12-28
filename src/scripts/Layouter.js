import DualLooper from './DualLooper';
import ListenerSystem from './ListenerSystem';
import setPointer from './setPointer';
import getRelativePos from './getRelativePos';
import objHovered from './objHovered';

/**
 * @constructor
 * @param {object[]} elements
 * @param {object} options
 * @property {MonoFont} options.font
 * @property {DOM element} options.parent
 * @property {MousedownTracker} options.mousedownTracker
 * @property {number} options.aspectWidth
 * @property {number} options.aspectHeight
 * @property {number} [options.xCenter]
 * - center of elements. defaults to center of canvas
 */
function Layouter(elements, options) {
	this.elements = elements;

	this.options = options;

	if (typeof this.options.xCenter != 'number') {
		this.options.xCenter = 0.5 * this.options.aspectWidth / this.options.aspectHeight;
	}

	this.running = false;
	this.armed = false;

	var top = 0;

	this.elements.forEach(function(element) {
		top += element.top || 0;

		// 0 is top of canvas. 1 is bottom of canvas
		element.y = top;

		var fontSize = this.styles[element.type].fontSize;
		var stringSize = this.options.font.getStringSize(element.text);

		element.width = (stringSize.width / stringSize.height) * fontSize;

		if (Layouter.isButton(element)) {
			element.width += 2 * this.styles[element.type].padding;

			element.buttonState = 'normal';

			top += 2 * this.styles[element.type].padding;
		}

		// 0 is center of canvas. 1 is to the right by the height of the canvas
		element.x = -element.width / 2 + this.options.xCenter;

		top += fontSize;

		element.height = top - element.y;

		top += element.bottom || 0;
	}.bind(this));

	this.mousemoveLS = new ListenerSystem(
		window,
		'mousemove',
		Layouter.handleMousemove.bind(this)
	);

	this.mousedownLS = new ListenerSystem(
		window,
		'mousedown',
		Layouter.handleMousedown.bind(this)
	);

	this.mouseupLS = new ListenerSystem(
		window,
		'mouseup',
		Layouter.handleMouseup.bind(this)
	);
}

Layouter.prototype.styles = {
	mainTitle: {
		fontSize: 0.15
	},
	title: {
		fontSize: 0.10
	},
	subtitle: {
		fontSize: 0.06
	},
	button: {
		fontSize: 0.07,
		padding: 0.015,
		backgroundColor: {
			normal: 'rgb(255, 255, 255)',
			hover: 'rgb(220, 220, 220)',
			down: 'rgb(53, 94, 41)'
		}
	},
	gameButton: {
		fontSize: 0.0455,
		padding: 0.012,
		backgroundColor: {
			normal: 'rgb(255, 255, 255)',
			hover: 'rgb(220, 220, 220)',
			down: 'rgb(53, 94, 41)'
		}
	}
};

Layouter.isButton = function(element) {
	return element.type == 'button' || element.type == 'gameButton';
}

Layouter.prototype.draw = function(ctx) {
	ctx.save();

	this.elements.forEach(function(element) {
		ctx.save();

		ctx.translate(element.x * ctx.canvas.height, element.y * ctx.canvas.height);

		if (Layouter.isButton(element)) {
			this.drawButton(ctx, element);
		}
		else {
			this.drawFontElement(ctx, element);
		}

		ctx.restore();
	}.bind(this));

	ctx.restore();
};

Layouter.prototype.drawFontElement = function(ctx, element) {
	ctx.save();

	var fontSize = this.styles[element.type].fontSize;

	var scale = fontSize * ctx.canvas.height / this.options.font.size.y;

	ctx.scale(scale, scale);

	this.options.font.drawString(ctx, element.text);

	ctx.restore();
};

Layouter.prototype.drawButton = function(ctx, element) {
	ctx.save();
	ctx.scale(ctx.canvas.height, ctx.canvas.height);
	ctx.fillStyle = this.styles[element.type].backgroundColor[element.buttonState];
	ctx.fillRect(0, 0, element.width, element.height);
	ctx.restore();

	ctx.save();

	ctx.translate(this.styles[element.type].padding * ctx.canvas.height, this.styles[element.type].padding * ctx.canvas.height);

	this.drawFontElement(ctx, element);

	ctx.restore();
};

Layouter.prototype.start = function(ctx) {
	if (!this.running) {
		// console.log("start");

		this.ctx = ctx;

		this.arm();

		this.dualLooper = new DualLooper({
			regWork: function() {

			},

			finalWork: function() {
				this.draw(this.ctx);
			}.bind(this)
		});

		this.dualLooper.start();

		this.running = true;
	}
};

Layouter.prototype.stop = function(work) {
	if (this.running) {
		this.disarm();

		this.stopWork = work;

		this.dualLooper.stopCallback = function() {
			this.running = false;

			this.stopWork();
		}.bind(this);

		this.dualLooper.stop();
	}
};

Layouter.prototype.arm = function() {
	if (!this.armed) {
		this.mousemoveLS.start();
		this.mousedownLS.start();
		this.mouseupLS.start();

		this.armed = true;
	}
};

Layouter.prototype.disarm = function() {
	if (this.armed) {
		this.mousemoveLS.stop();
		this.mousedownLS.stop();
		this.mouseupLS.stop();

		this.armed = false;
	}
};

Layouter.handleMousemove = function(e) {
	var mousePos = getRelativePos(e, this.options.parent);

	this.updateButtonStates(mousePos);
};

Layouter.handleMousedown = function(e) {
	var mousePos = getRelativePos(e, this.options.parent);

	this.updateButtonStates(mousePos);
};

Layouter.handleMouseup = function(e) {
	var mousePos = getRelativePos(e, this.options.parent);

	this.updateButtonStates(mousePos);

	for (var i = 0; i < this.elements.length; i += 1) {
		var element = this.elements[i];

		if (Layouter.isButton(element)) {
			var hovered = objHovered(element, mousePos);

			if (hovered) {
				for (var l = 0; l < this.options.listeners.length; l += 1) {
					var listener = this.options.listeners[l];

					if (listener.id == element.id && listener.event == 'up') {
						listener.action();
					}
				}
			}
		}
	}
};

/**
 * Update button states for the mouse being at mousePos
 */
Layouter.prototype.updateButtonStates = function(mousePos) {
	var aButtonHovered = false;

	for (var i = 0; i < this.elements.length; i += 1) {
		var element = this.elements[i];

		if (Layouter.isButton(element)) {
			var hovered = objHovered(element, mousePos);

			if (hovered) {
				aButtonHovered = true;

				if (this.options.mousedownTracker.mousedown) {
					element.buttonState = 'down';
				}
				else {
					element.buttonState = 'hover';
				}
			}
			else {
				element.buttonState = 'normal';
			}
		}
	}

	if (aButtonHovered) {
		setPointer('pointer');
	}
	else {
		setPointer('');
	}
};

export default Layouter
