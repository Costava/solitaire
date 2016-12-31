import SeededRNG from './SeededRNG';
import DualLooper from './DualLooper';
import ListenerSystem from './ListenerSystem';
import Layouter from './Layouter';
import setPointer from './setPointer';
import setImageSmoothing from './setImageSmoothing';
import getMousePos from './getMousePos';
import getTouchPos from './getTouchPos';
import getRelativePos from './getRelativePos';
import objHovered from './objHovered';

/**
 * @constructor
 * @param {object} o
 * @property {CanvasRenderingContext2D} o.ctx
 * @property {MonoFont} o.font
 * @property {Spriter} o.suitSpriter
 * @property {MousedownTracker} o.mousedownTracker
 * @property {function} o.quitCallback
 * @property {number} [o.seed]
 * @property {number} [o.aspectWidth=16]
 * @property {number} [o.aspectHeight=9]
 */
function Solitaire(o) {
	this.ctx = o.ctx;

	this.font = o.font
	this.suitSpriter = o.suitSpriter;

	this.mousedownTracker = o.mousedownTracker;

	this.quitCallback = o.quitCallback;

	this.srng = new SeededRNG(o.seed);

	this.aspectWidth = o.aspectWidth || 16;
	this.aspectHeight = o.aspectHeight || 9;

	//////////

	this.oldPos = null;

	this.running = false;
	this.armed = false;

	//////////

	this.labelMargin = 0.01;
	this.fontHeight = 0.04;

	this.cardWidth = 0.18;
	this.cardHeight = 0.27;
	this.horizSpace = 0.036;// Between piles

	this.facedownSpacing = 0.02;
	this.faceupSpacing = this.getFaceupSpacing();

	this.pilesY = this.getPilesY();

	this.horizMargin = this.getHorizMargin();

	this.turnPilePos = this.getTurnPilePos();
	this.turnedPilePos = this.getTurnedPilePos();
	this.buttonsPos = this.getButtonsPos();

	this.foundationsPos = this.getFoundationsPos();

	//////////

	this.mousemoveLS = new ListenerSystem(
		window,
		'mousemove',
		Solitaire.handleMousemove.bind(this)
	);

	this.mousedownLS = new ListenerSystem(
		window,
		'mousedown',
		Solitaire.handleMousedown.bind(this)
	);

	this.mouseupLS = new ListenerSystem(
		window,
		'mouseup',
		Solitaire.handleMouseup.bind(this)
	);

	////////// Same for touch in addition to mouse

	this.touchmoveLS = new ListenerSystem(
		window,
		'touchmove',
		Solitaire.handleTouchmove.bind(this)
	);

	this.touchstartLS = new ListenerSystem(
		window,
		'touchstart',
		Solitaire.handleTouchstart.bind(this)
	);

	this.touchendLS = new ListenerSystem(
		window,
		'touchend',
		Solitaire.handleTouchend.bind(this)
	);

	//////////

	this.buttonsMenu = new Layouter(
		[
			{
				top: this.horizSpace * 2.34,
				type: 'gameButton',
				text: "Quit",
				id: 'quit'
			},
			{
				top: this.horizSpace,
				type: 'gameButton',
				text: "New Game",
				id: 'newgame'
			}
		],
		{
			font: this.font,
			parent: this.ctx.canvas,
			mousedownTracker: this.mousedownTracker,
			aspectWidth: this.aspectWidth,
			aspectHeight: this.aspectHeight,
			xCenter: this.horizMargin + 2.5 * this.cardWidth + 2 * this.horizSpace,
			listeners: [
				{
					id: 'quit',
					event: 'up',
					action: function() {
						console.log("Quit");

						this.stop(function() {
							this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

							this.quitCallback();
						}.bind(this));
					}.bind(this)
				},
				{
					id: 'newgame',
					event: 'up',
					action: function() {
						this.newGame();
					}.bind(this)
				}
			]
		}
	);
}// End of constructor

Solitaire.NUM_FOUNDATIONS = 4;
Solitaire.NUM_PILES = 7;

//////////

/**
 * @returns {number}
 */
Solitaire.prototype.getFaceupSpacing = function() {
	return this.labelMargin + this.fontHeight;
};

/**
 * @returns {number}
 */
Solitaire.prototype.getPilesY = function() {
	return this.cardHeight + 2 * this.horizSpace;
};

/**
 * @returns {number}
 */
Solitaire.prototype.getHorizMargin = function() {
	return (1 * (this.aspectWidth / this.aspectHeight) - 7 * this.cardWidth - 6 * this.horizSpace) / 2;
};

/**
 * @returns {object}
 */
Solitaire.prototype.getTurnPilePos = function() {
	return {
		x: this.horizMargin,
		y: this.horizSpace,
		width: this.cardWidth,
		height: this.cardHeight
	};
};

/**
 * @returns {object}
 */
Solitaire.prototype.getTurnedPilePos = function() {
	return {
		x: this.horizMargin + this.cardWidth + this.horizSpace,
		y: this.horizSpace,
		width: this.cardWidth,
		height: this.cardHeight
	};
};

/**
 * @returns {object}
 */
Solitaire.prototype.getButtonsPos = function() {
	return {
		x: this.horizMargin + 2 * this.cardWidth + 2 * this.horizSpace,
		y: this.turnedPilePos.y,
		width: this.cardWidth,
		height: this.cardHeight
	};
};

/**
 * Get positions of foundations
 * @returns {object[]}
 */
Solitaire.prototype.getFoundationsPos = function() {
	var pos = [];

	var y = this.horizSpace;

	for (var f = 0; f < Solitaire.NUM_FOUNDATIONS; f += 1) {
		var x = (this.aspectWidth / this.aspectHeight) - this.horizMargin;

		x -= (Solitaire.NUM_FOUNDATIONS - f) * this.cardWidth;
		x -= (Solitaire.NUM_FOUNDATIONS - f - 1) * this.horizSpace;

		pos.push({
			x: x,
			y: y,
			width: this.cardWidth,
			height: this.cardHeight,

			foundation: f,
			isFoundationBase: true
		});
	}

	// 0 index is farthest left
	return pos;
};

//////////

Solitaire.prototype.newGame = function() {
	console.log("New game. Seed:", this.srng.seed);

	this.heldCard = null;
	// A card position that is hovered
	this.hoverPos = null;

	this.foundations = [[], [], [], []];

	var deck = this.getShuffledDeck();

	this.piles = Solitaire.getNewPiles(deck);
	this.pileBasePos = this.getPileBasePos();

	this.turnPile = deck;
	this.turnedPile = [];// The pile of cards taken off turnPile

	this.updateTurnPileCards();

	this.updatePileCardPositions();
};

Solitaire.prototype.start = function() {
	if (!this.running) {
		console.log("Start Solitaire");

		this.arm();

		this.dualLooper = new DualLooper({
			regWork: function() {

			},

			finalWork: function() {
				this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

				this.drawTurnPile();
				this.drawTurnedPile();

				this.drawPiles();
				this.drawFoundations();
				this.drawHoverPos();

				this.drawHeldCards();
			}.bind(this)
		});

		this.dualLooper.start();

		this.buttonsMenu.start(this.ctx);

		this.running = true;
	}
};

/**
 * @param {function} work
 */
Solitaire.prototype.stop = function(work) {
	if (this.running) {
		console.log("Stop Solitaire");

		this.disarm();

		this.stopWork = work;

		this.buttonsMenu.stop(function() {
			this.dualLooper.stopCallback = function() {
				this.running = false;

				this.stopWork();
			}.bind(this);

			this.dualLooper.stop();
		}.bind(this));
	}
};

Solitaire.prototype.arm = function() {
	if (!this.armed) {
		this.mousemoveLS.start();
		this.mousedownLS.start();
		this.mouseupLS.start();

		this.touchmoveLS.start();
		this.touchstartLS.start();
		this.touchendLS.start();

		this.armed = true;
	}
};

Solitaire.prototype.disarm = function() {
	if (this.armed) {
		this.mousemoveLS.stop();
		this.mousedownLS.stop();
		this.mouseupLS.stop();

		this.touchmoveLS.stop();
		this.touchstartLS.stop();
		this.touchendLS.stop();

		this.armed = false;
	}
};

/**
 * @param {object} card
 * @param {number} x
 * @param {number} y
 */
Solitaire.moveCard = function(card, x, y) {
	if (card != null) {
		card.x += x;
		card.y += y;

		Solitaire.moveCard(card.next, x, y);
	}
};

/**
 * @param {Event} e
 */
Solitaire.handleTouchmove = function(e) {
	e.preventDefault();

	var pos = getTouchPos(e);

	if (this.oldPos == null) {
		e.movementX = 0;
		e.movementY = 0;
	}
	else {
		e.movementX = pos.x - this.oldPos.x;
		e.movementY = pos.y - this.oldPos.y;

		// console.log(e.movementX);
	}

	this.oldPos = pos;

	this.handleMove(e, pos);
};

/**
 * @param {Event} e
 */
Solitaire.handleMousemove = function(e) {
	// console.log("handleMousemove");

	var pos = getMousePos(e);

	this.handleMove(e, pos);
};

Solitaire.prototype.handleMove = function(e, pos) {
	var mousePos = getRelativePos(pos, this.ctx.canvas);

	if (this.heldCard == null && (this.turnPile.length > 0 || this.turnedPile.length > 0)) {
		var topTurnPileCard = this.turnPilePos;

		if (objHovered(topTurnPileCard, mousePos)) {
			setPointer('pointer');

			return;
		}
	}

	this.hoverPos = this.getHoverPos(mousePos);

	if (this.hoverPos != null && this.hoverPos.onTurnedPile && this.heldCard != null) {
		this.hoverPos = null;
	}

	if (this.heldCard != null) {
		var dx = e.movementX / this.ctx.canvas.height;
		var dy = e.movementY / this.ctx.canvas.height;

		Solitaire.moveCard(this.heldCard, dx, dy);
	}

	if (this.heldCard != null || this.hoverPos != null) {
		setPointer('pointer');
	}
	else {
		setPointer('');
	}
};

/**
 * @param {Event} e
 */
Solitaire.handleTouchstart = function(e) {
	e.preventDefault();

	// console.log("handleTouchstart");

	var pos = getTouchPos(e);
	var relPos = getRelativePos(pos, this.ctx.canvas);

	this.oldPos = pos;

	// console.log("this.buttonsPos:", this.buttonsPos);
	// console.log("relPos:", relPos);

	if (objHovered(this.buttonsPos, relPos)) {
		// console.log("menu");

		// e.pageX = pos.x;
		// e.pageY = pos.y;

		Layouter.handleMousedown.call(this.buttonsMenu, {pageX: pos.x, pageY: pos.y})
	}
	else {
		// console.log("not menu");

		this.handleDown(pos);
	}

	// this.handleDown(pos);
};

/**
 * @param {Event} e
 */
Solitaire.handleMousedown = function(e) {
	var pos = getMousePos(e);

	this.handleDown(pos);
};

/**
 * @param {Event} e
 */
Solitaire.prototype.handleDown = function(pos) {
	var mousePos = getRelativePos(pos, this.ctx.canvas);

	if (this.turnPile.length > 0 || this.turnedPile.length > 0) {
		var topTurnPileCard = this.turnPile[this.turnPile.length - 1] || this.turnPilePos;

		if (objHovered(topTurnPileCard, mousePos)) {
			if (this.turnPile.length > 0) {
				this.turnCard();

				if (this.turnPile.length > 0) {
					setPointer('pointer');
				}
				else {
					setPointer('');
				}

				return;
			}
			else {
				this.resetTurnPile();
			}
		}
	}

	if (this.turnedPile.length > 0) {
		if (objHovered(this.turnedPilePos, mousePos) && this.heldCard == null) {
			this.heldCard = this.turnedPile[this.turnedPile.length - 1];

			this.heldCard.onTurnedPile = false;
			this.heldCard.fromTurnedPile = true;

			this.turnedPile.pop();

			setPointer('pointer');

			return;
		}
	}

	var hoverPos = this.getHoverPos(mousePos);

	if (this.heldCard == null && hoverPos != null) {
		this.heldCard = hoverPos;

		this.removeCardFromPile(this.heldCard.pile, this.heldCard);

		this.hoverPos = this.getHoverPos(mousePos);
	}
	else {
		this.hoverPos = hoverPos;
	}

	if (this.heldCard != null || this.hoverPos != null) {
		setPointer('pointer');
	}
	else {
		setPointer('');
	}
};

/**
 * @param {Event} e
 */
Solitaire.handleTouchend = function(e) {
	e.preventDefault();

	var pos = getTouchPos(e);
	var relPos = getRelativePos(pos, this.ctx.canvas);

	this.oldPos = pos;

	if (objHovered(this.buttonsPos, relPos)) {
		Layouter.handleMouseup.call(this.buttonsMenu, {pageX: pos.x, pageY: pos.y})
	}
	else {
		this.handleUp(pos);
	}
};

/**
 * @param {Event} e
 */
Solitaire.handleMouseup = function(e) {
	var pos = getMousePos(e);

	this.handleUp(pos);
};

/**
 * @param {Event} e
 */
Solitaire.prototype.handleUp = function(pos) {
	// console.log("handleMouseup");

	var mousePos = getRelativePos(pos, this.ctx.canvas);

	if (this.heldCard == null && (this.turnPile.length > 0 || this.turnedPile.length > 0)) {
		var topTurnPileCard = this.turnPile[this.turnPile.length - 1] || this.turnPilePos;

		if (objHovered(topTurnPileCard, mousePos)) {
			setPointer('pointer');

			return;
		}
	}

	this.hoverPos = this.getHoverPos(mousePos);

	if (this.heldCard != null && this.heldCard.fromTurnedPile) {
		// console.log("this.hoverPos:", this.hoverPos, "this.heldCard:", this.heldCard);

		if (Solitaire.canPutOn(this.hoverPos, this.heldCard)) {
			// console.log("canPutOn", "this.hoverPos:", this.hoverPos, "this.heldCard:", this.heldCard);

			if (this.hoverPos.onFoundation || this.hoverPos.isFoundationBase) {
				var foundation = this.foundations[this.hoverPos.foundation];

				this.heldCard.x = this.hoverPos.x;
				this.heldCard.y = this.hoverPos.y;
				this.heldCard.foundation = this.hoverPos.foundation;
				this.heldCard.onFoundation = true;

				foundation.push(this.heldCard);
			}
			else {
				this.addCardToPile(this.hoverPos.pile, this.heldCard);

				this.heldCard.pile = this.hoverPos.pile;

				this.updatePileCardPositions();
			}

			this.heldCard.fromTurnedPile = false;
			this.heldCard.onTurnedPile = false;
		}
		else {
			this.turnedPile.push(this.heldCard);

			this.heldCard.onTurnedPile = true;
			this.heldCard.fromTurnedPile = false;

			this.heldCard.x = this.turnedPilePos.x;
			this.heldCard.y = this.turnedPilePos.y;
		}

		this.heldCard = null;

		this.hoverPos = this.getHoverPos(mousePos);

		if (this.hoverPos != null) {
			setPointer('pointer');
		}
		else {
			setPointer('');
		}

		return;
	}

	if (this.hoverPos != null && (this.hoverPos.isFoundationBase || this.hoverPos.onFoundation)) {
		if (this.heldCard != null) {
			var foundation = this.foundations[this.hoverPos.foundation];

			var parent;

			if (foundation.length == 0) {
				parent = this.hoverPos;
			}
			else {
				parent = foundation[foundation.length - 1];
			}

			var canPutOn = Solitaire.canPutOn(parent, this.heldCard);

			// console.log("canPutOn:", canPutOn, "this.hoverPos:", this.hoverPos, "this.heldCard:", this.heldCard);

			if (canPutOn) {
				this.heldCard.x = this.hoverPos.x;
				this.heldCard.y = this.hoverPos.y;
				this.heldCard.foundation = this.hoverPos.foundation;
				this.heldCard.onFoundation = true;

				foundation.push(this.heldCard);

				var pile = this.piles[this.heldCard.pile];

				if (pile.length > 0) {
					pile[pile.length - 1].facedown = false;
				}

				this.heldCard = null;

				return;
			}
		}
	}

	if (this.hoverPos != null && this.heldCard != null && Solitaire.canPutOn(this.hoverPos, this.heldCard)) {
		var oldPileNum = this.heldCard.pile;

		this.addCardToPile(this.hoverPos.pile, this.heldCard);

		var pile = this.piles[oldPileNum];

		if (pile.length > 0) {
			pile[pile.length - 1].facedown = false;
		}

		this.heldCard.pile = this.hoverPos.pile;
	}
	else if (this.heldCard != null) {
		this.addCardToPile(this.heldCard.pile, this.heldCard);
	}

	this.heldCard = null;

	this.hoverPos = this.getHoverPos(mousePos);

	this.updatePileCardPositions();

	if (this.heldCard != null || this.hoverPos != null) {
		setPointer('pointer');
	}
	else {
		setPointer('');
	}
};

Solitaire.prototype.resetTurnPile = function() {
	if (this.turnPile.length == 0 && this.turnedPile.length > 0) {
		this.turnPile = this.turnedPile.reverse();

		this.turnedPile = [];

		for (var c = 0; c < this.turnPile.length; c += 1) {
			var card = this.turnPile[c];

			card.x = this.turnPilePos.x;
			card.y = this.turnPilePos.y;
			card.facedown = true;
		}
	}
};

Solitaire.prototype.turnCard = function() {
	if (this.turnPile.length > 0) {
		var newCard = this.turnPile.pop();

		newCard.facedown = false;
		newCard.onTurnedPile = true;
		newCard.x = this.horizMargin + this.cardWidth + this.horizSpace;
		newCard.y = this.horizSpace;

		this.turnedPile.push(newCard);
	}
};

/**
 * @param {object} parentCard
 * @param {object} childCard
 * @returns {boolean}
 */
Solitaire.canPutOn = function(parentCard, childCard) {
	// console.log("parentCard:", parentCard, "childCard:", childCard);

	if (parentCard == null || childCard == null) {
		return false;
	}

	if (parentCard.isPileBase && childCard.rank == 12) {
		return true;
	}

	if (parentCard.isFoundationBase && childCard.rank == 0) {
		return true;
	}

	// Since counting up on foundations
	if (parentCard.onFoundation && childCard.rank == parentCard.rank + 1 && childCard.suit == parentCard.suit) {
		return true;
	}

	var differentSuitColors = parentCard.suit % 2 != childCard.suit % 2;

	if (!differentSuitColors) {
		return false;
	}

	return childCard.rank == parentCard.rank - 1;
};

/**
 * @param {number} pileNum
 * @param {object} card
 */
Solitaire.prototype.addCardToPile = function(pileNum, card) {
	if (card != null) {
		var pile = this.piles[pileNum];

		if (pile.length > 0) {
			var topCard = pile[pile.length - 1];

			topCard.next = card;
		}

		card.pile = pileNum;

		pile.push(card);

		this.addCardToPile(pileNum, card.next);
	}
};

/**
 * @param {number} pileNum
 * @param {object} card
 */
Solitaire.prototype.removeCardFromPile = function(pileNum, card) {
	if (card != null) {
		var pile = this.piles[pileNum];

		var removeIndex = pile.indexOf(card);

		pile.splice(removeIndex, 1);

		if (pile.length > 0) {
			if (removeIndex > 0) {
				pile[removeIndex - 1].next = null;
			}
		}

		this.removeCardFromPile(pileNum, card.next);
	}
};

/**
 * @param {object} mousePos
 * @returns {object|null}
 */
Solitaire.prototype.getHoverPos = function(mousePos) {
	// console.log("updateHoverPos", "mousePos:", mousePos, "this.hoverPos:", this.hoverPos);

	if (objHovered(this.turnedPilePos, mousePos)) {
		if (this.turnedPile.length > 0) {
			var topTurnedCard = this.turnedPile[this.turnedPile.length - 1];

			return topTurnedCard;
		}
	}

	for (var f = 0; f < this.foundations.length; f += 1) {
		var foundation = this.foundations[f];

		var topCard;

		if (foundation.length == 0) {
			topCard = this.foundationsPos[f];
		}
		else {
			topCard = foundation[foundation.length - 1];
		}

		if (this.heldCard != null && Solitaire.canPutOn(topCard, this.heldCard)) {
			if (objHovered(topCard, mousePos)) {
				return topCard;
			}
		}
	}

	for (var p = 0; p < this.piles.length; p += 1) {
		var pile = this.piles[p];

		if (pile.length == 0) {
			if (this.heldCard != null && this.heldCard.rank == 12) {
				var base = this.pileBasePos[p];

				if (objHovered(base, mousePos)) {
					return base;
				}
			}
		}
		else {
			for (var c = pile.length - 1; c >= 0; c -= 1) {
				var card = pile[c];

				if ((this.heldCard != null && Solitaire.canPutOn(card, this.heldCard)) || this.heldCard == null) {
					if (!card.facedown && this.heldCard != card) {
						if (objHovered(card, mousePos)) {
							return card;
						}
					}
				}
			}
		}
	}

	return null;
};

Solitaire.prototype.drawHoverPos = function() {
	if (this.hoverPos != null) {
		this.ctx.save();

		var amount = 0.10;

		this.ctx.scale(this.ctx.canvas.height, this.ctx.canvas.height);

		this.ctx.translate(
			this.hoverPos.x - amount * this.cardWidth,
			this.hoverPos.y - amount * this.cardHeight
		);

		this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
		this.ctx.fillRect(
			0, 0,
			(1 + 2 * amount) * this.cardWidth,
			(1 + 2 * amount) * this.cardHeight
		);

		this.ctx.restore();
	}
};

Solitaire.prototype.drawHeldCards = function() {
	this.tryDrawCard(this.heldCard);
};

/**
 * @param {object} card - okay if null
 */
Solitaire.prototype.tryDrawCard = function(card) {
	if (card != null) {
		this.drawCard(card);

		this.tryDrawCard(card.next);
	}
};

/**
 * @param {object} card - should not be null
 */
Solitaire.prototype.drawCard = function(card) {
	if (card.facedown) {
		this.drawFacedownCard(card);
	}
	else {
		this.drawFaceupCard(card);
	}
};

Solitaire.prototype.drawPiles = function() {
	for (var p = 0; p < this.piles.length; p += 1) {
		var pile = this.piles[p];

		for (var c = 0; c < pile.length; c += 1) {
			var card = pile[c];

			this.drawCard(card);
		}
	}
};

Solitaire.prototype.drawFoundations = function() {
	for (var f = 0; f < this.foundations.length; f += 1) {
		var foundation = this.foundations[f];

		if (foundation.length == 0) {
			var pos = this.foundationsPos[f];

			this.ctx.save();

			this.ctx.scale(this.ctx.canvas.height, this.ctx.canvas.height);

			this.ctx.translate(pos.x, pos.y);

			this.ctx.fillStyle = 'rgb(100, 100, 100)';
			this.ctx.fillRect(0, 0, this.cardWidth, this.cardHeight);

			this.ctx.restore();
		}
		else {
			var card = foundation[foundation.length - 1];

			this.drawFaceupCard(card);
		}
	}
};

Solitaire.prototype.updateTurnPileCards = function() {
	for (var c = 0; c < this.turnPile.length; c += 1) {
		var card = this.turnPile[c];

		card.facedown = true;
		card.x = this.horizMargin;
		card.y = this.horizSpace;
	}
};

Solitaire.prototype.drawTurnPile = function() {
	if (this.turnPile.length > 0) {
		var topCard = this.turnPile[this.turnPile.length - 1];

		this.drawCard(topCard);
	}
	else if (this.turnedPile.length > 0) {
		var pos = this.turnPilePos;

		this.ctx.save();

		this.ctx.scale(this.ctx.canvas.height, this.ctx.canvas.height);

		this.ctx.translate(pos.x, pos.y);

		this.ctx.fillStyle = 'rgb(100, 100, 100)';
		this.ctx.fillRect(0, 0, this.cardWidth, this.cardHeight);

		this.ctx.restore();
	}
};

Solitaire.prototype.drawTurnedPile = function() {
	if (this.turnedPile.length > 0) {
		var topCard = this.turnedPile[this.turnedPile.length - 1];

		this.drawCard(topCard);
	}
};

/**
 * @param {object} card
 */
Solitaire.prototype.drawFacedownCard = function(card) {
	this.ctx.save();

	this.ctx.scale(this.ctx.canvas.height, this.ctx.canvas.height);

	this.ctx.translate(card.x, card.y);

	this.ctx.fillStyle = 'rgb(233, 233, 233)';
	this.ctx.fillRect(0, 0, this.cardWidth, this.cardHeight);

	var amount = 0.03;

	this.ctx.fillStyle = 'rgb(150, 150, 255)';
	this.ctx.fillRect(
		amount * this.cardWidth,
		amount * this.cardHeight,
		(1 - 2 * amount) * this.cardWidth,
		(1 - 2 * amount) * this.cardHeight
	);

	this.ctx.restore();
};

/**
 * @param {object} card
 */
Solitaire.prototype.drawFaceupCardBackground = function(card) {
	this.ctx.save();

		this.ctx.scale(this.ctx.canvas.height, this.ctx.canvas.height);

		this.ctx.translate(card.x, card.y);

		this.ctx.fillStyle = 'rgb(244, 244, 244)';
		this.ctx.fillRect(0, 0, this.cardWidth, this.cardHeight);

		var amount = 0.02;

		this.ctx.fillStyle = 'rgb(255, 255, 255)';
		this.ctx.fillRect(
			amount * this.cardWidth,
			amount * this.cardHeight,
			(1 - 2 * amount) * this.cardWidth,
			(1 - 2 * amount) * this.cardHeight
		);

	this.ctx.restore();
};

/**
 * @param {object} card
 */
Solitaire.prototype.drawFaceupCard = function(card) {
	this.drawFaceupCardBackground(card);

	this.ctx.save();

		this.ctx.translate(
			(card.x + this.labelMargin) * this.ctx.canvas.height,
			(card.y + this.labelMargin) * this.ctx.canvas.height
		);

		this.ctx.save();
			var fontScale = this.ctx.canvas.height * this.fontHeight / this.font.size.y;

			this.ctx.scale(fontScale, fontScale);

			this.font.drawString(this.ctx, Solitaire.ranks[card.rank]);
		this.ctx.restore();

		this.ctx.translate(
			this.font.size.x / this.font.size.y * this.fontHeight * (String(Solitaire.ranks[card.rank]).length + 1) * this.ctx.canvas.height,
			0
		);

		// console.log("this.suitSpriter.size.y:", this.suitSpriter.size.y, "this.font.size.y:", this.font.size.y);
		// console.log("this.font.size:", this.font.size, "this.suitSpriter.size:", this.suitSpriter.size);

		// Magic number because images not same height for some reason
		var suitScale = this.ctx.canvas.height * this.fontHeight / (this.suitSpriter.size.y + 7);

		// console.log("fontScale:", fontScale, "suitScale:", suitScale);

		this.ctx.scale(suitScale, suitScale);

		setImageSmoothing(this.ctx, false);
		this.suitSpriter.drawSprite(this.ctx, Solitaire.suits[card.suit]);

	this.ctx.restore();
};

/**
 * @returns {object[]}
 */
Solitaire.prototype.getPileBasePos = function() {
	var pos = [];

	for (var p = 0; p < this.piles.length; p += 1) {
		var card = {};

		card.y = this.pilesY;
		card.x = this.horizMargin + p * (this.cardWidth + this.horizSpace);

		card.width = this.cardWidth;
		card.height = this.cardHeight;

		card.pile = p;
		card.isPileBase = true;

		pos.push(card);
	}

	return pos;
};

Solitaire.prototype.updatePileCardPositions = function() {
	for (var p = 0; p < this.piles.length; p += 1) {
		var pile = this.piles[p];

		var currentY = this.pilesY;

		for (var c = 0; c < pile.length; c += 1) {
			var card = pile[c];

			card.y = currentY;
			card.x = this.horizMargin + p * (this.cardWidth + this.horizSpace);

			if (card.facedown) {
				currentY += this.facedownSpacing;
			}
			else {
				currentY += this.faceupSpacing;
			}
		}
	}
};

/**
 * @param {object[]} deck
 */
Solitaire.getNewPiles = function(deck) {
	var piles = [];

	for (var p = 0; p < 7; p += 1) {
		piles.push([]);

		for (var c = 0; c < p; c += 1) {
			var card = deck.pop();

			card.facedown = true;
			card.pile = p;

			piles[p].push(card);
		}

		var card = deck.pop();

		card.facedown = false;
		card.pile = p;

		piles[p].push(card);
	}

	return piles;
};

/**
 * @returns {object[]}
 */
Solitaire.prototype.getSortedDeck = function() {
	var deck = [];

	for (var s = 0; s < Solitaire.suits.length; s += 1) {
		for (var r = 0; r < Solitaire.ranks.length; r += 1) {
			deck.push({
				rank: r,
				suit: s,
				width: this.cardWidth,
				height: this.cardHeight,
				next: null// Faceup card on top of it if this is faceup in a pile
			});
		}
	}

	return deck;
};

/**
 * @returns {object[]}
 */
Solitaire.prototype.getShuffledDeck = function() {
	var deck = this.getSortedDeck();

	var shuffled = [];

	var numCards = deck.length;

	for (var i = 0; i < numCards; i += 1) {
		var index = this.srng.randomInt(0, deck.length - 1);

		var selected = deck[index];

		shuffled.push(selected);

		deck.splice(index, 1);
	}

	return shuffled;
};

Solitaire.ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
Solitaire.suits = ["clubs", "diamonds", "spades", "hearts"];

export default Solitaire
