/**
 * @overview Šedé našeptávání přímo v inputboxu
 * @version 0.6.3 Highlight JSON
 */

/**
 * @class Našeptávání přimo do inputu s doplňováním šipkou doprava (kliknutím)
 */
JAK.Suggest5Words = JAK.ClassMaker.makeClass({
	NAME: "JAK.Suggest5Words",
	VERSION: "0.6.3",
	EXTEND: JAK.Suggest5
});

/**
 * @constant styl myši po najetí na šedé našeptávané slovo
 */
JAK.Suggest5Words.CURSOR = "pointer";

/**
 * klikatelná oblast pro přidání slova
 */
JAK.Suggest5Words.clickableArea = (function() {
	var o = {
		start: 0,
		end: 0
	};
	var clickableArea = function(setup) {
		this.set(setup);
	};
	clickableArea.prototype.set = function(setup) {
		for (p in setup) {
			if (o.hasOwnProperty(p)) {
				o[p] = setup[p];
			}
		}
	};
	clickableArea.prototype.get = function() {
		return JSON.parse(JSON.stringify(o));
	};
	clickableArea.prototype.clear = function() {
		o.start = o.end = 0;
	};
	clickableArea.prototype.clickable = function(e) {
		var x = (e.changedTouches ? e.changedTouches[0] : e).clientX;
		return (o.start <= x && x <= o.end);
	};
	return clickableArea;
})();

/**
 * Vstupní parametry, viz JAK.Suggest5
 */
JAK.Suggest5Words.prototype.$constructor = function(searchbox, wrapper, options) {
	if (typeof options != "object") {
		options = {};
	}
	this._suggestWords = {
		color: options["sgWordColor"] || "#bbb", // standardní barva našeptání v searchboxu (šedá)
		prevSgWord: "", // cache - poslední šedé našeptání
		prevQuery: "", // poslední dotaz (input)
		locked: true, // ošetření, aby po kliknnutí do vyhledávacího pole se nedoplnilo slovo
		touched: false, // bylo ťapnuto našeptávání
		mousedownPos: null,
		lastTimeSuggestWordsAdded: null,
		cache: new JAK.Suggest5.Cache({limit: 25, caseSensitive: true}),
		additionalWord: "",
		/* klikatelná oblast šedého našeptání, bod A je levý horní roh, bod B je pravý spodní roh
		 * word je šedé našeptávané (viditelné) slovo */
		suggest: new JAK.Suggest5Words.clickableArea()
	};

	this.$super.apply(this, arguments);
};

JAK.Suggest5Words.prototype.action = function(e) {
	this._clearWord();
	this.$super.apply(this, arguments);
}

JAK.Suggest5Words.prototype._build = function(id) {
	this.$super.apply(this, arguments);
	var input = this.getInput();

	/* Klon hledacího inputu */
	this._dom.sgWordCont = document.createElement("input");
	this._dom.sgWordCont.className = input.className + " suggestWords_sugword hidden";
	this._dom.sgWordCont.type = input.type;
	this._dom.sgWordCont.style.opacity = 1; // sjednotíme styl všech prohlížečů
	this._dom.sgWordCont.style.color = this._suggestWords.color;
	this._dom.sgWordCont.setAttribute("disabled", "disabled");


	/* Element, sloužící pro výpočet klikac oblasti šedého našeptání */
	this._dom.sgWordFake = document.createElement("div");
	this._dom.sgWordFake.className = "suggestWords_fake";


	/* Události */
	if ( "oninput" in input ) {
		this._ec.push(JAK.Events.addListener(input, "input", this, "_checkInput"));
	} else {
		this._ec.push(JAK.Events.addListener(input, "keypress", this, "_checkInput"));
	}

	if ( "ontouchend" in window ) {
		this._ec.push(JAK.Events.addListener(input, "touchend", this, "_touchOnSuggest"));
	}
	this._ec.push(JAK.Events.addListener(input, "click", this, "_clickOnSuggest"));
	this._ec.push(JAK.Events.addListener(input, "dblclick", this, function() { this._suggestWords.locked = true; })); // při dvojkliku zrušíme vložení šedého našeptání
	this._ec.push(JAK.Events.addListener(input, "mousedown", this, "_saveMouseDownPos"));
	this._ec.push(JAK.Events.addListener(input, "mousemove", this, "_checkClickableSuggest"));


	/* vytvoříme obal pro šedé našeptávání */
	var wrapper = document.createElement("div");
	wrapper.className = "suggestWords_wrapper";
	input.parentNode.insertBefore(wrapper, input);
	input.classList.add("suggestWords_input");
	wrapper.appendChild(input);
	wrapper.appendChild(this._dom.sgWordFake);
	wrapper.appendChild(this._dom.sgWordCont);


	/* Až to bude možné, nastavíme styly*/
	if (document.readyState == "complete") {
		this._loadStyles();
	} else {
		this._ec.push(JAK.Events.addListener(window, "load", this, "_loadStyles"));
	}
};

JAK.Suggest5Words.prototype._loadStyles = function() {
	var style = this._dom.sgWordFake.style;
	style.paddingLeft = JAK.DOM.getStyle(this._dom.sgWordCont, "paddingLeft");
	style.paddingRight = JAK.DOM.getStyle(this._dom.sgWordCont, "paddingRight");
	style.fontFamily = JAK.DOM.getStyle(this._dom.sgWordCont, "fontFamily");
	style.fontSize = JAK.DOM.getStyle(this._dom.sgWordCont, "fontSize");
	style.fontWeight = JAK.DOM.getStyle(this._dom.sgWordCont, "fontWeight");
	style.fontStyle = JAK.DOM.getStyle(this._dom.sgWordCont, "fontStyle");
	this._dom.sgWordCont.classList.remove("hidden");
};

JAK.Suggest5Words.prototype._checkInput = function(e) {
	switch (e.type) {
		case "input":
			if (this._dom.sgWordCont.value.indexOf(this.getInput().value) !== 0) {
				this._clearWord();
			}
			break;
		case "keypress":
			this._clearWord();
			break;
	}
};

JAK.Suggest5Words.prototype._keydown = function(e, elm) {
	this.$super.apply(this, arguments);
	var code = e.keyCode;
	switch (code) {
		case 39: /* šipka vpravo */
			if (this._addWord()) { this.makeEvent("suggest-keyboard", {code: code, addWord: 1}); }
		break;
		case 38: /* šipka nahoru */
		case 40: /* šipka dolů */
			if (this._activeItem == null) {
				this._dom.sgWordCont.value = this._suggestWords.prevSgWord;
			} else {
				this._clearWord();
			}
		break;
		case 0:
			this._clearWord();
		break;
	}
};

JAK.Suggest5Words.prototype._focus = function(e, elm) {
	this.$super.apply(this, arguments);
	this._locked = true;
	if (this._suggestWords.prevQuery == this.getInput().value) {
		this._suggestWords.lastTimeSuggestWordsAdded = new Date().getTime();
		this._dom.sgWordCont.value = this._suggestWords.prevSgWord;
	}
};

JAK.Suggest5Words.prototype._hide = function(e, elm) {
	this.$super.apply(this, arguments);
	this._suggestWords.locked = true;
	this._clearWord();
};

JAK.Suggest5Words.prototype._response = function() {
	var prop = "sugQuery", // název očekávaného objektu z backendu našeptávače
		d = this.$super.apply(this, arguments); // zpracovaná data

	if (d && d.hasOwnProperty(prop)) { // máme-li data potřebná data ze serveru
		this._sugWord(d[prop]); // zkusíme je vykreslit
	} else {
		this._suggestWords.prevSgWord = "";
	}
};

/**
 * Našeptávač po jednotlivých slovech
 */
JAK.Suggest5Words.prototype._sugWord = function(d) {
	var input = this.getInput(),
		value = input.value, /* hodnota vstupního pole */
		inputWidth = input.offsetWidth;

	if (this.getQuery() != value) { /* někdy může nastat, že hodnota dotazu není shodná s dotazem na našeptávač (rychlým psaním) */
		this._clearWord();
		return;
	}

	this._suggestWords.prevQuery = value;

	this._suggestWords.additionalWord = d.phrase + d.gphrase; /* slovo, které se doplní při addWord */
	this._dom.sgWordCont.value = this._suggestWords.prevSgWord = value + d.gphrase; /* výpis našeptávaného slova */
	this._calculateClickableWord([value, d.gphrase]); /* zavolání výpočtu, kolik zabírají jaká slova */

	this._suggestWords.lastTimeSuggestWordsAdded = new Date().getTime();

	if (this._dom.sgWordFake.offsetWidth > inputWidth) { /* je-li našeptávaná fráze přiliš dlouhá, nezobrazíme ji */
		this._clearWord();
		JAK.DOM.clear(this._dom.sgWordFake);
	}
};

/**
 * Došeptá slovo
 */
JAK.Suggest5Words.prototype._addWord = function(force) {
	var input = this.getInput(),
		caret = JAK.Suggest5.getCaret(input),
		sgWordValue = this._dom.sgWordCont.value;

	if (caret.end == input.value.length && sgWordValue != "") {
		this.setQuery(this._suggestWords.additionalWord);
		if (!this.isOpen() && input.value == this._suggestWords.prevQuery) { return; } /* žádná změna */
		this._clearWord();
		this._startRequest();
		this._suggestWords.locked = false;
		setTimeout(this._setCaretToEnd.bind(this), 400);
		return true;
	}

	return false;
};

/**
 * Vymaže našeptané slovo
 */
JAK.Suggest5Words.prototype._clearWord = function() {
	if (this._dom.sgWordCont.value != "") {
		this._suggestWords.prevSgWord = this._dom.sgWordCont.value;
		this._suggestWords.suggest.clear();
		this._dom.sgWordCont.value = "";
		this.getInput().style.cursor = "";
	}
};

/**
 * Uložení pozice stisknutí myši - ošetření proti kliknutí na šedé našeptávané tažením myši
 */
JAK.Suggest5Words.prototype._saveMouseDownPos = function(e, elm) {
	this._suggestWords.mousedownPos = {x: e.clientX, y: e.clientY};
};

/**
 * Kontrola, zda zle kliknout na šedé našeptání
 */
JAK.Suggest5Words.prototype._checkClickableSuggest = function(e, elm) {
	var cursor = "",
		result = false,
		input = this.getInput();

	if ( this._suggestWords.mousedownPos == null && this._dom.sgWordCont.value && this._suggestWords.suggest.clickable(e) ) {
		cursor = JAK.Suggest5Words.CURSOR;
		result = true;
	}

	if ( input.style.cursor != cursor ) {
		input.style.cursor = cursor
	};

	return result;
};

/**
 *
 */
JAK.Suggest5Words.prototype._touchOnSuggest = function(e, elm) {
	this._suggestWords.touched = true;

	if ( this._suggestWords.locked == true ) {
		this._suggestWords.locked = false;
		return;
	}

	if ( this._suggestWords.suggest.clickable(e) ) {
		JAK.Events.cancelDef(e);
		if ( this._addWord() ) {
			this.makeEvent("suggest-touch", {action: "append"});
		}
	}
};

/**
 *
 */
JAK.Suggest5Words.prototype._clickOnSuggest = function(e, elm) {
	if ( this._suggestWords.touched ) {
		this._suggestWords.touched = false;
		return;
	}

	/* Povolení prokliknutí šedého našeptávače, pokud je šedé našeptání nějakou dobu zobrazeno -
	 * řešíme tím problém, kdy nejde prokliknout šedé našeptání vybereme-li hledací políčko tabulátorem
	 */
	var now = new Date().getTime();
	var last = (this._suggestWords.lastTimeSuggestWordsAdded) ? this._suggestWords.lastTimeSuggestWordsAdded : now;
	if ( now - last > 400 ) {
		this._suggestWords.locked = false;
	}

	var checkClick = (this._suggestWords.mousedownPos.x == e.clientX && this._suggestWords.mousedownPos.y == e.clientY);
	this._suggestWords.mousedownPos = null;

	var clickable = this._checkClickableSuggest(e, elm);

	if ( !checkClick || e.button != 0 || this._suggestWords.locked == true ) {
		this._suggestWords.lastTimeSuggestWordsAdded = new Date().getTime();
		return;
	}

	if ( clickable ) {
		JAK.Events.cancelDef(e);
		if ( this._addWord() ) {
			this.makeEvent("suggest-mouse", {action: "append"});
		}
	}
};

/**
 * Výpočet pro klikatelnou oblast šedého našeptání
 */
JAK.Suggest5Words.prototype._calculateClickableWord = function(words) {
	var spanHTML = "",
		sgWordFake = this._dom.sgWordFake,
		el = this.getInput(),
		cacheId = words.join("-"),
		cached = this._suggestWords.cache.get(cacheId);

	if (cached) {
		this._suggestWords.suggest.set(cached);
		return;
	}

	words.forEach(function(v) {
		spanHTML += "<span>" + v + "</span>";
	});
	sgWordFake.innerHTML = spanHTML;

	var targetPos = el.getBoundingClientRect();
	var startX = targetPos.left + parseInt(JAK.DOM.getStyle(el, "paddingLeft"), 10) + sgWordFake.children[0].offsetWidth;
	var endX = startX + sgWordFake.children[1].offsetWidth;

	this._suggestWords.suggest.set({
		start: startX,
		end: endX
	});

	this._suggestWords.cache.put(cacheId, this._suggestWords.suggest.get());
};
