/**
 * @overview speechbubble
 * @version 0.2.1
*/   

/**
 * @class Tvorba bubliny
 * @group jak-widgets
 */
JAK.SpeechBubble = JAK.ClassMaker.makeClass({
	NAME: "SpeechBubble",
	VERSION: "0.2.1"
});

/**
 * @param {object} [optObj] Konfiguracni objekt
 * @param {string} [optObj.imagePath="/img/shadow-"] Cesta k obrazkum
 * @param {string} [optObj.imageFormat="png"] Pripona obrazku (png/gif/jpg)
 * @param {int} [optObj.sizes.line] Délka linky
 * @param {int} [optObj.sizes.corner] Sířka a výška rohu (musí být stejná)
 */
JAK.SpeechBubble.prototype.$constructor = function(elements, optObj) {
	this._elements = elements;
	/*this._ec = [];*/
	this._options = {
		imagePath: "",
		imageFormat: "png",
		sizes: {
			line: 6,
			corner: 12
		}
	};
	for (var p in optObj) { this._options[p] = optObj[p]; }
	this._build();
};

JAK.SpeechBubble.prototype._build = function() {
	var opts = this._options;
	for (i = 0; i < this._elements.length; i++) {
		var bubble = this._elements[i];
		JAK.DOM.addClass(bubble, "fulltext-bubble");
		/* IE8 a nižší, neumí border-radius ani multibackground */
		if (JAK.Browser.client == "ie" && JAK.Browser.version < 9) {
			var style = {
				background: "transparent url('" + opts.imagePath + "roh." + opts.imageFormat + "')",
				width: opts.sizes.corner + "px",
				height: opts.sizes.corner + "px",
				position: "absolute"
			};
			bubble.appendChild(JAK.mel("div", {}, this._changeStyle(style, {backgroundPosition: "left top", left: "-1px", top: "-1px"})));
			bubble.appendChild(JAK.mel("div", {}, this._changeStyle(style, {backgroundPosition: "right top", right: "-1px", top: "-1px"})));
			bubble.appendChild(JAK.mel("div", {}, this._changeStyle(style, {backgroundPosition: "right bottom", right: "-1px", bottom: "-1px"})));
			bubble.appendChild(JAK.mel("div", {}, this._changeStyle(style, {backgroundPosition: "left bottom", left: "-1px", bottom: "-1px"})));
			bubble.className += " ie8";
			bubble.style.borderWidth = "1px";
			continue;
		}
		this._resize(bubble);
	}	
};

JAK.SpeechBubble.prototype._changeStyle = function(style, newstyle) {
	var s = {};
	for (var p in style) { s[p] = style[p]; }
	for (var p in newstyle) { s[p] = newstyle[p]; }
	return s;
};

JAK.SpeechBubble.prototype._resize = function(elm) {
	if (!window.getComputedStyle) { return; }

	var corner = this._options.sizes.corner;
	var line = this._options.sizes.line;
	var bubble = elm;

	var style = window.getComputedStyle(bubble, null);
	var halfLine = line/2;

	var width = bubble.offsetWidth%line;
	var height = bubble.offsetHeight%line;

	var new_width = (line/2 - width)/2;
	var new_height = (line/2 - height)/2;

	bubble.style.paddingTop = parseFloat(style.paddingTop) + new_height + "px";
	bubble.style.paddingLeft = parseFloat(style.paddingLeft) + new_width + "px";
	bubble.style.paddingRight = parseFloat(style.paddingRight) + new_width + "px";
	bubble.style.paddingBottom = parseFloat(style.paddingBottom) + new_height + "px";
};


/**
 * @method Explicitni desktruktor. Smaze vsechny vlastnosti.
 */
JAK.SpeechBubble.prototype.$destructor = function() {
	for (var p in this) { this[p] = null; }
};
