import ListenerSystem from './ListenerSystem';

/**
 * @constructor
 */
function MousedownTracker() {
	this.mousedown = false;

	this.mousedownLS = new ListenerSystem(
		window,
		'mousedown',
		function() {
			this.mousedown = true;
		}.bind(this)
	);

	this.mouseupLS = new ListenerSystem(
		window,
		'mouseup',
		function() {
			this.mousedown = false;
		}.bind(this)
	);
}

MousedownTracker.prototype.start = function() {
	this.mousedownLS.start();
	this.mouseupLS.start();
};

MousedownTracker.prototype.stop = function() {
	this.mousedownLS.stop();
	this.mouseupLS.stop();
};

export default MousedownTracker
