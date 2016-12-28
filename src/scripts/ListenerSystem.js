/**
 * @constructor
 * @param {DOM element} target
 * @param {string} eventType
 * @param {function} work - what to do when hear event
 */
function ListenerSystem(target, eventType, work) {
	this.target = target;
	this.eventType = eventType;
	this.work = work;

	this.active = false;
}

ListenerSystem.prototype.start = function() {
	if (!this.active) {
		this.target.addEventListener(this.eventType, this.work);

		this.active = true;
	}
};

ListenerSystem.prototype.stop = function() {
	if (this.active) {
		this.target.removeEventListener(this.eventType, this.work);

		this.active = false;
	}
};

export default ListenerSystem
