/**
 * @constructor
 * @param {function} work
 * @param {number} delay
 */
function Timeout(work, delay) {
	this.work = work;
	this.delay = delay;

	this.waiting = false;
	this.timeout;
}

Timeout.prototype.set = function() {
	if (this.waiting) {
		clearTimeout(this.timeout);
	}

	this.timeout = setTimeout(function() {
		this.waiting = false;

		this.work();
	}.bind(this), this.delay);

	this.waiting = true;
};

Timeout.prototype.clear = function() {
	if (this.waiting) {
		clearTimeout(this.timeout);

		this.waiting = false;
	}
};

export default Timeout
