(function () {

	/**
	 * Create canvas and context
	 */
	class Canvas {

		/**
		 * @param id ID of canvas node
		 */
		constructor(id = 'matrix') {
			this.canvas = document.getElementById(id);

			if (!this.canvas) {
				throw new Error('Can not find canvas ID');
			}

			this.context = this.canvas.getContext('2d');
			this.setSizes();
			this.fillBackground();
		}

		setSizes() {
			this.canvas.width = this.getWidth();
			this.canvas.height = this.getHeight();
		}

		setFont(size) {
			this.context.font = size + 'px Arial';
		}

		setShadows() {
			this.context.fillStyle = 'rgba(57, 228, 57, 1)';
			this.context.font = '22px Arial';
			this.context.shadowColor = 'rgba(57, 228, 57, 1)';
			this.context.shadowOffsetX = 0;
			this.context.shadowOffsetY = 0;
			this.context.shadowBlur = 20;
			this.context.textAlign = 'left';
		}

		fillBackground() {
			this.context.fillStyle = '#000';
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		}

		getWidth() {

			return Math.max(
				document.body.scrollWidth,
				document.body.offsetWidth,
				document.documentElement.scrollWidth,
				document.documentElement.offsetWidth,
				document.documentElement.clientWidth
			);
		}

		getHeight() {

			return Math.max(
				document.body.scrollHeight,
				document.body.offsetHeight,
				document.documentElement.scrollHeight,
				document.documentElement.offsetHeight,
				document.documentElement.clientHeight
			);
		}
	}

	/**
	 * Each symbol settings
	 */
	class Symbol {

		/**
		 * @param name		the symbol itself
		 * @param x			x coordinate
		 * @param y			y coordinate
		 * @param opacity	the symbol opacity
		 */
		constructor(name, x, y, opacity = 0.8) {
			this.name = name;
			this.x = x;
			this.y = y;
			this.opacity = opacity;
		}

		/**
		 * Draw symbol in chosen context
		 *
		 * @param context
		 */
		draw(context) {
			context.textAlign = 'center';
			context.fillStyle = 'rgba(57, 228, 57,' + this.opacity + ')';
			context.fillText(this.name, this.x, this.y);
		}
	}

	/**
	 * Timing for stop/start functionality
	 */
	class Timer {

		constructor() {
			this.startTime = performance.now();
			this.stopTime = 0;
			this.elapsedTime = 0;
		}

		stop() {
			this.stopTime = performance.now();
			this.setElapsedTime();
		}

		start() {
			this.startTime = performance.now();
			this.stopTime = 0;
		}

		reset() {
			this.startTime = performance.now();
			this.stopTime = 0;
			this.elapsedTime = 0;
		}

		setElapsedTime() {
			this.elapsedTime += this.stopTime ? this.stopTime - this.startTime : performance.now() - this.startTime;
		}

		getElapsedTime() {
			return this.stopTime ? this.elapsedTime : this.elapsedTime + performance.now() - this.startTime;
		}
	}

	/**
	 * Main class
	 */
	class MatrixIntro {

		/**
		 * @param {Object} args
		 * @param {number} args.fontSize			Font size in pixels
		 * @param {number} args.removeColumnTime	Time in milliseconds after which next column will be removed
		 * @param {number} args.frameSpeed			Speed of changing frames. The less - the faster
		 * @param {number} args.splitColumns		Amount of columns in one block
		 * @param {number} args.keepColumnsAmount	How many columns should stay before run "failure" animation
		 * @param {number} args.failureWaitingTime	Time in milliseconds to show "failure" animation
		 * @param {string} args.foundNumbers		String with found numbers. Length of string should be the same as
		 * 											split columns value
		 */
		constructor(args) {

			args = args || {};

			this.isVisibleFailureText = true;
			this.symbols = [];
			this.symbolNumber = 0;
			this.canvas = new Canvas();
			this.timer = new Timer();

			this.fontSize = args.fontSize || 22;
			this.canvas.setFont(this.fontSize);
			this.frameSpeed = args.frameSpeed || 4;
			this.removeColumnTime = args.removeColumnTime || 3000;
			this.splitColumns = args.splitColumns || 10;
			this.keepColumnsAmount = args.keepColumnsAmount || 2;
			this.failureWaitingTime = args.failureWaitingTime || 15000;
			this.foundNumbers = args.foundNumbers || '9375019583';
			this.loopTime = (this.splitColumns - this.keepColumnsAmount) * this.removeColumnTime + this.failureWaitingTime;

			this.stringsAmount = this.canvas.canvas.height / this.fontSize;
			this.stringLength = this.canvas.canvas.width / this.fontSize;

			this.setEvents();
			this.setSteps();
		}

		setSteps() {

			const firstMessage = 'Call trans opt: received. ' + new Date().toLocaleString() + ' REC:log>',
				secondMessage = 'Trace program: running';

			// First step. Just blinked cursor
			new Promise(resolve => {
				this.frame = requestAnimationFrame(() => this.showBlink(''));
				setTimeout(() => {
					cancelAnimationFrame(this.frame);
					resolve();
				}, 4000);
			})
			//Second step. Show first message
			.then(result => new Promise(resolve => {
				this.symbolNumber = 0;
				this.frame = requestAnimationFrame(() => this.showMessage(firstMessage, resolve));
			}))
			// Third step. Keep message with blinked cursor for some time
			.then(result => new Promise(resolve => {
				this.frame = requestAnimationFrame(() => this.showBlink(firstMessage));
				setTimeout(() => {
					cancelAnimationFrame(this.frame);
					resolve();
				}, 4000);
			}))
			// Show second message
			.then(result => new Promise(resolve => {
				this.symbolNumber = 0;
				this.frame = requestAnimationFrame(() => this.showMessage(secondMessage, resolve));
			}))
			// Keep second message for some time
			.then(result => new Promise(resolve => {
				this.frame = requestAnimationFrame(() => this.showBlink(secondMessage));
				setTimeout(() => {
					cancelAnimationFrame(this.frame);
					resolve();
				}, 2000);
			}))
			// Start number tracing
			.then(result => new Promise(resolve => {
				this.timer.reset();
				this.frame = requestAnimationFrame(this.drawMatrix.bind(this));
				resolve();
			}));
		}

		setEvents() {
			window.addEventListener('resize', () => {
				this.canvas.setSizes();
				this.canvas.setFont(this.fontSize);
				this.stringsAmount = this.canvas.canvas.height / this.fontSize;
				this.stringLength = this.canvas.canvas.width / this.fontSize;
				cancelAnimationFrame(this.frame);
				this.setSteps();
			}, true);
		}

		drawMatrix() {

			if (this.frame % this.frameSpeed !== 0) {
				this.frame = requestAnimationFrame(this.drawMatrix.bind(this));
				return;
			}

			if (this.createNumbersMatrix()) {
				this.canvas.context.fillStyle = '#000';
				this.canvas.context.fillRect(0, 0, this.canvas.canvas.width, this.canvas.canvas.height);
				for (let symbol in this.symbols) {
					this.symbols[symbol].draw(this.canvas.context);
				}

				this.frame = requestAnimationFrame(this.drawMatrix.bind(this));
			} else {
				this.frame = requestAnimationFrame(this.showSystemFailure.bind(this));
			}
		}

		stop() {
			this.timer.stop();
			cancelAnimationFrame(this.frame);
		}

		start() {
			this.timer.start();
			this.frame = requestAnimationFrame(this.drawMatrix.bind(this));
		}

		createNumbersMatrix() {

			let columnsToRemove,
				backgroundSymbolsAmount;

			columnsToRemove = Math.floor(this.timer.getElapsedTime() / this.removeColumnTime);
			if (columnsToRemove + this.keepColumnsAmount > this.splitColumns) {
				return false;
			}

			this.symbols.length = 0;

			lengthLoop:
			for (let x = 1; x <= this.stringLength; x++) {
				for (let y = 1; y <= this.stringsAmount; y++) {

					if (y === 1) {
						continue;
					}

					if (columnsToRemove && Math.ceil(x / this.splitColumns) * this.splitColumns - x < columnsToRemove) {
						if (this.foundNumbers[x - 1]) {
							this.symbols.push(new Symbol(this.foundNumbers[x - 1], (x + this.splitColumns) * this.fontSize, this.fontSize, 1));
						}

						continue lengthLoop;
					}

					// Background symbols with less opacity
					backgroundSymbolsAmount = Math.random() * 3;

					for (let i = 1; i < backgroundSymbolsAmount; i++) {
						this.symbols.push(new Symbol(Math.floor(Math.random() * 10), x * this.fontSize, y * this.fontSize, 0.5 / i));
					}

					this.symbols.push(new Symbol(Math.floor(Math.random() * 10), x * this.fontSize, y * this.fontSize));
				}
			}

			return true;
		}

		showSystemFailure() {

			const failureFontSize = 40,
				failureText = 'System failure';

			if (this.frame % 50 !== 0) {
				this.frame = requestAnimationFrame(this.showSystemFailure.bind(this));
				return;
			}

			this.canvas.context.fillStyle = '#000';
			this.canvas.context.fillRect(this.canvas.canvas.width / 2 - 200, this.canvas.canvas.height / 2 - failureFontSize / 2 - 5, 400, failureFontSize + 10);

			if (this.isVisibleFailureText) {
				this.canvas.context.shadowBlur = null;
				this.canvas.context.shadowColor = null;
				this.canvas.context.save();
				this.canvas.context.strokeStyle = '#39E439';
				this.canvas.context.lineWidth = 2;
				this.canvas.context.strokeRect(this.canvas.canvas.width / 2 - 200, this.canvas.canvas.height / 2 - failureFontSize / 2 - 5, 400, failureFontSize + 10);
				this.canvas.context.textAlign = 'center';
				this.canvas.context.fillStyle = 'rgba(57, 228, 57, 1)';
				this.canvas.context.font = failureFontSize + 'px Arial';
				this.canvas.context.fillText(failureText, this.canvas.canvas.width / 2, this.canvas.canvas.height / 2 + failureFontSize * 0.3);
				this.canvas.context.restore();
			}

			if (this.timer.getElapsedTime() > this.loopTime) {
				this.timer.reset();
				this.isVisibleFailureText = true;
				this.setSteps();
			} else {
				// Toggle text each 50 frames
				this.isVisibleFailureText = !this.isVisibleFailureText;
				this.frame = requestAnimationFrame(this.showSystemFailure.bind(this));
			}
		}
		
		showMessage(message, resolve) {

			let string = message,
				textMeasure;

			if (this.frame % 2 !== 0) {
				this.frame = requestAnimationFrame(() => this.showMessage(message, resolve));
				return;
			}

			if (this.symbolNumber <= message.length) {
				this.symbolNumber++;

				string = message.substr(0, this.symbolNumber);
				textMeasure = this.canvas.context.measureText(string);

				this.canvas.fillBackground();
				this.canvas.setShadows();
				this.canvas.context.fillText(string, 30, 35);
				this.canvas.context.strokeText(string, 30, 35);
				this.addBlinkCursor(textMeasure.width + 35, 18);

				this.frame = requestAnimationFrame(() => this.showMessage(message, resolve));
			} else {
				resolve();
			}
		}

		showBlink(message = '') {

			let textMeasure;

			if (this.frame % 15 !== 0) {
				this.frame = requestAnimationFrame(() => this.showBlink(message));
				return;
			}

			textMeasure = this.canvas.context.measureText(message);

			this.canvas.fillBackground();
			this.canvas.setShadows();
			this.canvas.context.fillText(message, 30, 35);
			this.canvas.context.strokeText(message, 30, 35);

			if (this.isVisibleBlink) {
				this.addBlinkCursor(textMeasure.width + 35, 18);
			}

			this.frame = requestAnimationFrame(() => this.showBlink(message));
			this.isVisibleBlink = !this.isVisibleBlink;
		}

		addBlinkCursor(x, y) {
			this.canvas.context.strokeStyle = '#39E439';
			this.canvas.context.fillRect(x, y, 18, 20);
		}
	}

	/**
	 * Start simulator with options examples.
	 *
	 * @type {MatrixIntro}
	 */
	new MatrixIntro({
		fontSize: 22,
		frameSpeed: 4,
		removeColumnTime: 3000,
		splitColumns: 13,
		keepColumnsAmount: 3,
		failureWaitingTime: 15000,
		foundNumbers: '+380501234567'
	});
})();