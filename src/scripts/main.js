console.log('Hello');

//////////

import ImageURIs from './ImageURIs';
import ImageLoader from './ImageLoader';
import Spriter from './Spriter';
import MonoFont from './MonoFont';
import setImageSmoothing from './setImageSmoothing';
import Layouter from './Layouter';
import MousedownTracker from './MousedownTracker';
import Timeout from './Timeout';
import ListenerSystem from './ListenerSystem';
import MaxChildSize from './MaxChildSize';
import Solitaire from './Solitaire';

//////////

var aspectWidth = 16;
var aspectHeight = 9;

//////////

var can = document.querySelector('.js-app-canvas');
var ctx = can.getContext('2d');

var mousedownTracker = new MousedownTracker();
mousedownTracker.start();

// // Debug
// window.can = can;
// window.ctx = ctx;

// // Debug
// var testImage = new Image();
//
// testImage.onload = function() {
// 	console.log("Loaded testImage");
// 	ctx.drawImage(testImage, 10, 10);
//
// 	ctx.fillRect(50, 50, 200, 100);
// }
//
// testImage.src = 'http://i.imgur.com/1ezAphN.jpg';

var imgs;
var suitSpriter;
var font;

var mainMenu;
var aboutMenu;

var game;

new ImageLoader(ImageURIs, function(images) {
	console.log("Images loaded");

	imgs = images;

	suitSpriter = new Spriter(
		imgs.suits,
		{x: 0, y: 0},
		{x: 17, y: 19},
		{x: 1, y: 0},
		{
			clubs: {x: 0, y: 0},
			spades: {x: 1, y: 0},
			diamonds: {x: 2, y: 0},
			hearts: {x: 3, y: 0}
		}
	);

	font = new MonoFont(
		imgs.font5x14,
		{x: 1, y: 1},
		{x: 5, y: 14},
		{x: 1, y: 1},
		[
			'AaBbCcDdEeFfGgHhIiJjKkLlMm',
			'NnOoPpQqRrSsTtUuVvWwXxYyZz',
			"`1234567890-=[]\\;',./ ",// Space character at end of this string
			'~!@#$%^&*()_+{}|:"<>?'
		]
	);

	// // Debug
	// ctx.scale(3, 3);
	// setImageSmoothing(ctx, false);// So that text is not blurry
	// font.drawString(ctx, "You've gŒt mail!");

	mainMenu = new Layouter(
		[
			{
				top: 0.15,
				bottom: 0.15,
				type: 'mainTitle',
				text: "Solitaire",
			},
			{
				top: 0,
				bottom: 0.05,
				type: 'button',
				text: "Play",
				id: 'play'
			},
			{
				type: 'button',
				text: "About",
				id: 'about'
			}
		],
		{
			font: font,
			parent: can,
			mousedownTracker: mousedownTracker,
			aspectWidth: aspectWidth,
			aspectHeight: aspectHeight,
			listeners: [
				{
					id: 'play',
					event: 'up',
					action: function() {
						mainMenu.stop(function() {
							// Start game

							game = new Solitaire({
								//646485469902,// early ace
								//1092456683128,// early ace and corresponding 2
								//5655854335,// early ace and then corresponding 2 from turn pile
								seed: Math.floor(new Date().getTime() * Math.random() * 0.007),
								ctx: ctx,
								font: font,
								suitSpriter: suitSpriter,
								mousedownTracker: mousedownTracker,
								quitCallback: function() {
									mainMenu.start(ctx);
								}
							});

							ctx.clearRect(0, 0, can.width, can.height);

							game.start();
						});
					}
				},
				{
					id: 'about',
					event: 'up',
					action: function() {
						mainMenu.stop(function() {
							ctx.clearRect(0, 0, can.width, can.height);

							console.log("Go to About menu");
							aboutMenu.start(ctx);
						});
					}
				}
			]
		}
	);

	aboutMenu = new Layouter(
		[
			{
				top: 0.08,
				bottom: 0.01,
				type: 'title',
				text: "Solitaire",
			},
			{
				top: 0,
				bottom: 0.08,
				type: 'subtitle',
				text: "Version 0.0.2",
			},
			{
				top: 0,
				bottom: 0.05,
				type: 'button',
				text: 'Author: Costava',
				id: 'author'
			},
			{
				top: 0,
				bottom: 0.05,
				type: 'button',
				text: 'View source on GitHub',
				id: 'source'
			},
			{
				type: 'button',
				text: "Back",
				id: 'back'
			}
		],
		{
			font: font,
			parent: can,
			mousedownTracker: mousedownTracker,
			aspectWidth: aspectWidth,
			aspectHeight: aspectHeight,
			listeners: [
				{
					id: 'author',
					event: 'up',
					action: function() {
						console.log("See author");

						window.open('https://github.com/Costava', '_blank');
					}
				},
				{
					id: 'source',
					event: 'up',
					action: function() {
						console.log("See source");

						window.open('https://github.com/Costava/solitaire', '_blank');
					}
				},
				{
					id: 'back',
					event: 'up',
					action: function() {
						aboutMenu.stop(function() {
							ctx.clearRect(0, 0, can.width, can.height);

							console.log("Go back to main menu");
							mainMenu.start(ctx);
						});
					}
				}
			]
		}
	);


	mainMenu.start(ctx);

	// // Debug
	// setInterval(function() {
	// 	mainMenu.draw(ctx);
	// }, 50);

	// // Debug
	// window.imgs = imgs;
	// window.suitSpriter = suitSpriter;
	// window.font = font;
	// window.mainMenu = mainMenu;
	// window.aboutMenu = aboutMenu;
});

//////////

function handleResize() {
	var parent = document.body;
	var appContainer = document.querySelector('.js-app-container');
	var appCanvas = document.querySelector('.js-app-canvas');

	var size = MaxChildSize(aspectWidth, aspectHeight, parent.offsetWidth, parent.offsetHeight);

	// Maximize size of app container while keeping 16/9 aspect ratio
	appContainer.style.width = `${size.width}px`;
	appContainer.style.height = `${size.height}px`;

	// Update canvas draw size
	// Canvas display size is updated by CSS
	appCanvas.width = size.width;
	appCanvas.height = size.height;

	// Center app container
	var horizRemaining = parent.offsetWidth - size.width;
	var vertRemaining = parent.offsetHeight - size.height;

	appContainer.style.marginLeft = `${Math.floor(horizRemaining / 2)}px`;
	appContainer.style.marginRight = `${Math.ceil(horizRemaining / 2)}px`;

	appContainer.style.marginTop = `${Math.floor(vertRemaining / 2)}px`;
	appContainer.style.marginBottom = `${Math.ceil(vertRemaining / 2)}px`;

	// app.draw();
}

var handleResizeTimeout = new Timeout(handleResize, 150);

var handleResizeLS = new ListenerSystem(
	window, 'resize', handleResizeTimeout.set.bind(handleResizeTimeout)
);

handleResizeLS.start();

// Initial run
handleResize();
