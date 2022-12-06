/**
 * @class Roztahuje obrazek na pozadi na celou sirku a vysku viewportu pri zachovani pomeru stran obrazku
 */
Homepage.BackgroundResizer = JAK.ClassMaker.makeClass({
	NAME:"Homepage.BackgroundResizer",
	VERSION:"1.0",
	CLASS:"class"
});

/**
 * @param {string} id elementu s obrazkem
 */
Homepage.BackgroundResizer.prototype.$constructor = function(imgId) {
	this._bgImage = JAK.gel(imgId);
	this._originalImage = this._getOriginalImageSize();
	this._viewport = {};
	this._xRatio = 0;
	this._yRatio = 0;
	this._ec = {};

	this._resize();

	this._ec.res = null;
	this.start();
};

/**
 * @param {string} id elementu s obrazkem
 */
Homepage.BackgroundResizer.prototype.$destructor = function() {
	this.stop()
	for (var i in this) {
		delete(i);
	}
};

/**
 * nahozeni resizatoru
 */
Homepage.BackgroundResizer.prototype.start = function() {
	if (this._ec.res == null) {
		this._resize();
		this._ec.res = JAK.Events.addListener(window, "resize", this, "_resize");
	}
}

/**
 * zastaveni resizatoru
 */
Homepage.BackgroundResizer.prototype.stop = function() {
	if (this._ec.res != null) {
		JAK.Events.removeListener(this._ec.res);
	}
	this._ec.res = null;
}

/**
 * Roztahuje a zmensuje obrazek.
 * Pokud je vysledna sirka obrazku vetsi nez sirka viewportu, centruje obrazek na stred.
 */
Homepage.BackgroundResizer.prototype._resize = function() {
	this._computeRatio();

	if(this._bgImage.height < this._viewport.height) {
		this._bgImage.style.height = this._viewport.height+"px";
		this._bgImage.style.width = (this._originalImage.width / 100) * this._yRatio+"px";

		if(((this._originalImage.width / 100) * this._yRatio) < this._viewport.width) {
			this._bgImage.style.width = this._viewport.width+"px";
			this._bgImage.style.height = (this._originalImage.height / 100) * this._xRatio+"px";
		}
	} else {
		this._bgImage.style.height = this._viewport.height+"px";
		this._bgImage.style.width = (this._originalImage.width / 100) * this._yRatio+"px";
	}

	if(((this._originalImage.width / 100) * this._yRatio) < this._viewport.width) {
		this._bgImage.style.width = this._viewport.width+"px";
		this._bgImage.style.height = (this._originalImage.height / 100) * this._xRatio+"px";
		this._bgImage.style.left = 0;
	} else {
		this._bgImage.style.left = "-"+(this._bgImage.width - this._viewport.width) / 2+"px";
	}
};

/**
 * Vraci objekt s rozmery zdrojoveho obrazku
 * @returns {object} s vlastnostmi: width, height
 */
Homepage.BackgroundResizer.prototype._getOriginalImageSize = function() {
	var dim = {};
	var img = new Image();
		img.src = this._bgImage.src;
	dim.width = this._bgImage.width;
	dim.height = this._bgImage.height;

	return dim;
};

/**
 * Vraci objekt obsahujici velikost viewportu
 * @returns {object} s vlastnostmi: width, height
 */
Homepage.BackgroundResizer.prototype._getViewportSize = function() {
	var dim = {};

	if(window.innerWidth) {
		dim.width = window.innerWidth;
		dim.height = window.innerHeight;
	} else {
		dim.width = document.documentElement.clientWidth;
		dim.height = document.documentElement.clientHeight;
	}

	return dim;
};

/**
 * Pri kazdem onresize nastavi nove hodnoty velikosti viewportu a spocte nasobky pro resize obrazku
 */
Homepage.BackgroundResizer.prototype._computeRatio = function() {
	this._viewport = this._getViewportSize();
	this._xRatio = (this._viewport.width * 100) / this._originalImage.width;
	this._yRatio = (this._viewport.height * 100) / this._originalImage.height;
};