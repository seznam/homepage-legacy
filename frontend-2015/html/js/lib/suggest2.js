/**
 * @overview Suggest NG - naseptavac nove generace
 * @version 4.6-s0
 */

/**
 * @class Trida, poskytujici "naseptavac" z dane adresy pro zadany inputbox
 * @signal suggestSubmit Zpetne kompatibilni verze "suggest-submit"
 * @signal suggest-submit Pouzito
 */
JAK.Suggest = JAK.ClassMaker.makeClass({
	NAME: "JAK.Suggest",
	VERSION: "4.6-s0",
	IMPLEMENT: JAK.ISignals
});

/**
 * @constant
 * Automaticky rezim, kdy se hodnota inputu meni vybiranim polozek
 */
JAK.Suggest.MODE_AUTOMATIC = 0;
/**
 * @constant
 * Manualni rezim, kdy se hodnota inputu meni sipkou doprava
 */
JAK.Suggest.MODE_MANUAL = 1;

/**
 * statická metoda - vrací {start,end} rozsah uživatelského výběru v inputu nebo textarey. V případě, že start==end, tak to znamená, že není nic vybráno, pouze umístěn kurzor.
 * UPOZORNĚNÍ: Ke korektnímu chování pod IE8 a níže je potřeba ručně provést na input focus().
 * @param {node} input element, se kterým chceme pracovat (musí být input typu text nebo textarea)
 * @returns {object {integer start&#44 integer end}} objekt obsahující začátek a konec výběru v inputu
 */
JAK.Suggest._getCaret = function(inputNode) {
	var _contextWindow = (inputNode.ownerDocument.defaultView || inputNode.ownerDocument.parentWindow);
	var caret = {};
	var OLD_IE = (document.selection && !window.getSelection);
	if (OLD_IE) {
		var selection = _contextWindow.document.selection.createRange();
		var bm = selection.getBookmark();
		var sel = inputNode.createTextRange();
		sel.moveToBookmark(bm);
		var sleft = inputNode.createTextRange();
		sleft.collapse(true);
		sleft.setEndPoint("EndToStart", sel);
		caret.start = sleft.text.length;
		caret.end = sleft.text.length + sel.text.length;
	} else {
		caret.start = inputNode.selectionStart;
		caret.end = inputNode.selectionEnd;
	}
	return caret;
};

/**
 * @param {string} id ID inputboxu, na ktery bude suggest navesen
 * @param {string} url adresa, na kterou se provadi zadost; musi byt v domene dokumentu!
 * @param {object} [options] Hash s dodatecnymi opsnami
 * @param {string} [options.dict=""] nazev slovniku
 * @param {int} [options.count=10] pocet vysledku
 * @param {bool} [options.prefix=false] ma-li se pouzit prefixove hledani
 * @param {bool} [options.highlight=false] ma-li se ve vysledcich zvyraznit hledany (pod)retezec
 * @param {bool} [options.mode=JAK.Suggest.MODE_AUTOMATIC] jak se ma chovat input pri vyberu polozek
 * @param {bool} [options.timeout=100] jak dlouho po zastaveni psani poslat request
 * @param {bool} [options.parentElement=id.form] rodic
 * @param {bool} [options.autoSubmit=true] Odeslat formular po aktivaci?
 */
JAK.Suggest.prototype.$constructor = function(id, url, options) {
	this._ec = []; /* event cache */
	this._dom = {};
	this.url = url;

	/* Výchozí nastavení předvoleb */
	this._options = {
		dict: "",
		count: 10,
		prefix: false,
		highlight: false,
		mode: JAK.Suggest.MODE_AUTOMATIC,
		parentElement: JAK.gel(id).form,
		timeout: 200,
		valCheckDelay: 100,
		autoSubmit: true,
		format: "xml", // umi jeste json, ale to je jen specialne pro MAPY
		sugWords: false
	}

	/* Předvolby předané scriptu (přepíšeme ty výchozí) */
	this.setOptions(options);

	if (["xml", "json"].indexOf(this._options.format) == -1) {
		throw new Error("Suggest: Unsupported format: " + this._options.format + ". Only xml and json are supported.");
	}

	this._items = [];
	this._navigableItems = [];

	this._query = "";
	this._rq = null;
	this._timeout = false;
	this._activeItem = false;
	this._opened = false;
	this._focusTo = false;
	this._request = this._request.bind(this);
	this._hoverLock = false;
	this._used = 0; /* 0 - not used, 1 - used partially, 2 - used fully */

	this._build(id);
};

JAK.Suggest.prototype.$destructor = function() {
	this._clear();
	JAK.Events.removeListeners(this._ec);
};

/**
 * Za behu zmeni opsny
 */
JAK.Suggest.prototype.setOptions = function(options) {
	for (var p in options) { this._options[p] = options[p]; }
};

/**
 * Vrací query
 * FIXME je nutne?
 */
JAK.Suggest.prototype.getQuery = function() {
	return this._query;
};

/**
 * Vrací políčko
 */
JAK.Suggest.prototype.getInput = function() {
	return this._dom.input;
};

JAK.Suggest.prototype.hide = function() {
	this._dom.container.style.display = "none";
	this._opened = false;
};

/**
 * Posle XMLHttpRequest
 */
JAK.Suggest.prototype._request = function() {
	if (this._dom.input.value.trim().length > 0) {
		this._query = this._dom.input.value;
		this._timeout = false;
		var url = this._buildUrl(this._query);

		/* pokud request jiz bezi, zrusime ho */
		if (this._rq) { this._rq.abort(); }

		this._rq = new JAK.Request(this._options.format == "xml" ? JAK.Request.XML : JAK.Request.TEXT);
		this._rq.setCallback(this, "_response");
		this._rq.send(url);
	}
};

/**
 * Zavola se pri "aktivaci" vybrane polozky (kliknuti, enter). Defaultne submitne formular.
 */
JAK.Suggest.prototype.action = function() {
	if ("ontouchend" in window) {
		/* pockame se schovavanim; kdyby nekdo delal doubletouch, aby nekliknul na to pod nami */
		var bound = this.hide.bind(this);
		var t = setTimeout(bound, 400);
	} else {
		this.hide();
	}

	var parent = this._dom.input.form;

	this.makeEvent("suggestSubmit", {form:parent}); /* zpetna kompatibilita */
	this.makeEvent("suggest-submit", {form:parent, used:this._used});

	if (this._options.autoSubmit && parent && parent.submit) { parent.submit(); }
};

/**
 * Vrátí index vybrané našeptané volby
 */
JAK.Suggest.prototype.getSelectedIndex = function() {
	return this._navigableItems.indexOf(this._activeItem);
};

/**
 * Vrati cislo, popisujici, jak moc byl suggest pouzit (0..2)
 * @obsolete Misto toho lepe pouzit hodnotu "used" ze signalu "suggest-submit"
 */
JAK.Suggest.prototype.used = function() {
	return this._used;
};

/**
 * Vrati prave vybranou polozku (instance JAK.Suggest.Remote/JAK.Suggest.Item)
 */
JAK.Suggest.prototype.getActive = function() {
	return this._activeItem;
};

/**
 * Přidá třídu pro daný browser kvůli ostylování
 */
JAK.Suggest.prototype._addBrowserClass = function(b) {
	if (JAK.Browser.client == b) {
		JAK.DOM.addClass(this._sgWordCont, b);
	}
};

/**
 * Přidá třídu pro danou platformu kvůli ostylování
 */
JAK.Suggest.prototype._addPlatformClass = function(b) {
	if (JAK.Browser.platform == b) {
		JAK.DOM.addClass(this._sgWordCont, b);
	}
};

/**
 * Vytvoření html elementů
 */
JAK.Suggest.prototype._build = function(id) {
	var input = JAK.gel(id);

	var container = JAK.mel("div", {className:"suggest"});
	this._options.parentElement.appendChild(container);

	var content = JAK.mel("div", {className:"content"});
	container.appendChild(content);

	this._dom.input = input;
	this._dom.container = container;
	this._dom.content = content;

	this._options.parentElement.style.position = "relative";

	if (this._options.sugWords) {
		/* Našeptávání po slovech */
		this._sgWordCont = JAK.mel("div", {id:"sgWordCont"});
		this._options.parentElement.appendChild(this._sgWordCont);

		this._sgWordWritten = JAK.mel("span", {id:"sgWordWritten"});
		this._sgWordCont.appendChild(this._sgWordWritten);

		this._sgWordRemain = JAK.mel("span", {id:"sgWordRemain"});
		this._sgWordCont.appendChild(this._sgWordRemain);

		/* Na některých OS v některých browserech má zobrazování chyby */
		var platforms = this._options.optimization.platforms;
		for (var p=0; platforms.length > p; p++) {
			this._addPlatformClass(platforms[p]);
		}
		var browsers = this._options.optimization.browsers;
		for (var b=0; browsers.length > b; b++) {
			this._addBrowserClass(browsers[b]);
		}

		this._ec.push(JAK.Events.addListener(this._sgWordRemain, "click", this, "_focusToQueryField"));
	}

	this.hide();
	this._options.parentElement.appendChild(container);

	this._ec.push(JAK.Events.addListener(input, "keydown", this, "_keydown"));
	this._ec.push(JAK.Events.addListener(input, "blur", this, "_blur"));
	this._ec.push(JAK.Events.addListener(input, "input", this, "_valCheck"));

	this._ec.push(JAK.Events.addListener(container, "mousedown", JAK.Events.stopEvent));
	this._ec.push(JAK.Events.addListener(document, "mousedown", this, "hide"));
	this._ec.push(JAK.Events.addListener(document, "mousemove",this, "_unlock"));

	/* Pokud nemáme k dispozici událost oninput, musíme kontrolovat pole v intervalu */
	if ("oninput" in window) {
		this._valCheck();
	} else {
		this._valCheckDelay();
	}
};

/**
 * Focusne hledací políčko pro psaní dotazu
 */
JAK.Suggest.prototype._focusToQueryField = function() {
	this._dom.input.focus();
};

/**
 * V daném intervalu sledujeme políčko s dotazem a jeho hodnotu pro další zpracování
 */
JAK.Suggest.prototype._valCheckDelay = function() {
	window.setTimeout(this._valCheck.bind(this), this._options.valCheckDelay);
};

/**
 * Je-li políčko pro dotaz prázdné, skryjeme suggest
 */
JAK.Suggest.prototype._valCheck = function() {
	if (!this._dom.input.value) {
		this._clearSgWord();
		this.hide();
	}

	if (!("oninput" in window)) {
		this._valCheckDelay();
	}
};

JAK.Suggest.prototype._show = function() {
	this._hoverLock = true;
	this._opened = true;
	this._dom.container.style.display = "";
	//this._updateWidth();
};

JAK.Suggest.prototype._updateWidth = function() {
	this._dom.container.style.width = this._dom.input.offsetWidth+"px";
}

JAK.Suggest.prototype._clear = function() {
	JAK.DOM.clear(this._dom.content);
	while (this._items.length) { this._items.shift().$destructor(); }
	this._navigableItems = [];
	this._activeItem = false;
};

JAK.Suggest.prototype._response = function(response) {
	this._rq = null;
	this._clear();

	if (this._options.format == "xml") {
		this._buildItemsFromXML(response);
	} else if (this._options.format == "json") {
		this._buildItemsFromJSON(response);
	}

	if (this._items.length) {
		this._show();
		var focusTo = this._focusItem;
		if (focusTo || focusTo == 0) {
			if(focusTo == -1 ) {
				this._highlight(this._navigableItems[this._navigableItems.length - 1]);
			} else {
				this._highlight(this._navigableItems[focusTo]);
			}
			this._focusTo = false;
		}
	} else {
		this.hide();
	}

	/*
	 * Došeptávání po slovech pouze pokud máme k dispozici odpověď
	 * a nepoužíváme pravostranné našeptávání!
	 */
	if (this._options.sugWords == 1) {
		if (this._items.length && this._items[0].getHighlightStart() == 0) {
			this._sugWord();
		} else {
			this._clearSgWord();
		}
	}
};

JAK.Suggest.prototype._buildItemsFromXML = function(xmlDoc) {
	var result = xmlDoc.documentElement;
	var items = result.getElementsByTagName("item");

	for (var i=0;i<items.length;i++) {
		var item = items[i];
		this._buildItem(item.getAttribute("value"), item.getAttribute("highlightStart"), item.getAttribute("highlightEnd"));
	}

	for (var i=0;i<this._items.length;i++) {
		this._dom.content.appendChild(this._items[i].getContainer());
	}
};

// NENI UNZIVERZALNE, ale specialne pro MAPY!!!
JAK.Suggest.prototype._buildItemsFromJSON = function(response) {
	var data = null;

	try {
		data = JSON.parse(response);
	} catch(e) {
		return;
	}

	var result = data.result;

	if (!result) { return; }

	for (var i = 0; i < result.length; i++) {
		var item = result[i];
		var userData = item.userData;
		if (!userData) { continue; }

		var firstRow  = userData.suggestFirstRow;
		var secondRow = userData.suggestSecondRow;
		var value     = firstRow + ", " + secondRow;

		var highlightStart = 0
		var highlightEnd   = 0;

		var indexOfQuery   = value.toLowerCase().indexOf(this._query.toLowerCase());
		var isQueryMatched = indexOfQuery > -1;

		if (isQueryMatched) {
			highlightStart = indexOfQuery;
			highlightEnd   = indexOfQuery + this._query.length;
		}

		this._buildItem(value, highlightStart, highlightEnd);
	}

	for (var i=0;i<this._items.length;i++) {
		this._dom.content.appendChild(this._items[i].getContainer());
	}
};


JAK.Suggest.prototype._buildItem = function(value, highlightStart, highlightEnd) {
	var item = new JAK.Suggest.Item(this, value, highlightStart, highlightEnd);
	this._items.push(item);
	if (item.isNavigable()) { this._navigableItems.push(item); }
};

JAK.Suggest.prototype._buildUrl = function(query) {
	var url = this.url;
	if (url.charAt(url.length-1) != "/") { url += "/"; }
	url += this._options.dict;
	var arr = [];
	arr.push("phrase="+encodeURIComponent(query));
	if (this._options.format == "xml") {
		arr.push("result=xml");
	}
	if (this._options.prefix) { arr.push("prefix=1"); }
	if (this._options.highlight) { arr.push("highlight=1"); }
	if (this._options.count) { arr.push("count="+this._options.count); }

	url += "?"+arr.join("&");
	return url;
};

JAK.Suggest.prototype._highlight = function(item) {
	this._activeItem = item;
	for (var i=0;i<this._navigableItems.length;i++) {
		var it = this._navigableItems[i];
		if (it == item) {
			it.hoverOn();
		} else {
			it.hoverOff();
		}
	}
};

/**
 * Našeptávač po jednotlivých slovech
 */
JAK.Suggest.prototype._sugWord = function() {
	if (this._dom.input.value == this._prevQuery) { return; } /* žádná změna */

	this._clearSgWord();

	if (this._items[0]) {
		this._sgWordWritten.innerHTML = this._dom.input.value;
		this._remain = this._getFollowingWord(this._dom.input.value, this._items[0].value);
		var remainStr = this._remain;
		if (JAK.Browser.client == "ie" && JAK.Browser.version <= 8) {
			remainStr = remainStr.replace(" ","&nbsp;");
		}
		this._sgWordRemain.innerHTML = remainStr;
	}

	this._prevQuery = this._dom.input.value;
};

/**
 * Došeptá slovo
 */
JAK.Suggest.prototype._addWord = function() {
	if (!this._options.sugWords) return;

	var caret = JAK.Suggest._getCaret(this._dom.input);
	if (caret.end == this._dom.input.value.length) {
		this._dom.input.value = this._query + this._remain;
		this._query = this._dom.input.value;
	}
	this._startRequest();
	this._sugWord();
};

/**
 * Vymaže našeptané slovo
 */
JAK.Suggest.prototype._clearSgWord = function() {
	if (this._options.sugWords) {
		this._sgWordRemain.innerHTML = "";
		this._remain = "";
	}
};

/**
 * Vrátí první slovo z řetězce
 */
JAK.Suggest.prototype._getFollowingWord = function(q, firstItem) {
	var remain = firstItem.substring(q.length, firstItem.length);

	var firstSpacePos = remain.indexOf(" ");
	if (firstSpacePos != -1) {
		if (firstSpacePos == 0) {
			if (remain.match(/ /g).length >= 2) {
				return remain.substring(0, remain.indexOf(" ", 1));
			}
		} else {
			return remain.substring(0, firstSpacePos);
		}
	}

	return remain;
};

/**
 * Handler pro keydown na hledacím inputu
 */
JAK.Suggest.prototype._keydown = function(e, elm) {
	var code = e.keyCode;

	if (!this._opened) {
		if (code == 40) {
			this._focusItem = 0;
			this._startRequest();
			return;
		} else if (code == 38) {
			this._focusItem = -1;
			this._startRequest();
			return;
		}
	}
	/* Enter */
	if (code == 13) {
		JAK.Events.cancelDef(e);
		if (this._activeItem) {
			this._used = 2;
			this._activeItem.action();
		} else {
			this.action();
		}
	/* Sipka doprava */
	} else if (code == 39 && this._activeItem && this._options.mode == JAK.Suggest.MODE_MANUAL) {
		this._activeItem.rightNavigateAction();
		return;
	/* Doplnit slovo na šipku doprava */
	} else if (code == 39) {
		this._addWord();
	/* Sipka dolu */
	} else if (this._navigableItems.length && code == 40) {
		JAK.Events.cancelDef(e);
		this._clearSgWord();
		this._stepDown();
	/* Sipka nahoru */
	} else if (this._navigableItems.length && code == 38) {
		JAK.Events.cancelDef(e);
		this._stepUp();
	/* backspace, delete */
	} else if (code == 8 || code == 46) {
		this._highlight(false);
		this._clearSgWord();
		this._startRequest();
	/* esc, tab */
	} else if ((code == 27 || code == 9) && this._opened) {
		this.hide();
	} else if (((code < 33) || (code > 39)) && [27,44,45,17,18].indexOf(code) == -1) {
		this._startRequest();
	}
};
  
JAK.Suggest.prototype._stepUp = function() {
	this._used = 1;
	var index = this._navigableItems.indexOf(this._activeItem);
	var cnt = this._navigableItems.length;
	if (index == 0) {
		this._highlight(false);
		this._setCaretToEnd();
		this._dom.input.value = this.getQuery();
		return;
	} else if (index == -1) {
		index = cnt - 1
	} else {
		index = (index == -1 || index == 0 ? 0 : index-1);
	}
	this._highlight(this._navigableItems[index]);
	this._activeItem.highlightNavigateAction();
};

JAK.Suggest.prototype._stepDown = function() {
	this._used = 1;
	var index = this._navigableItems.indexOf(this._activeItem);
	var cnt = this._navigableItems.length;
	if (index == cnt - 1) {
		this._highlight(false);
		this._setCaretToEnd();
		this._dom.input.value = this.getQuery();
		return;
	} else if (index == -1) {
		index = 0;
	} else {
		index++;
	}
	this._highlight(this._navigableItems[index]);
	this._activeItem.highlightNavigateAction();
};

JAK.Suggest.prototype._setCaretToEnd = function() {
	var input = this._dom.input;
	var chars = input.value.length;
	if (input.setSelectionRange) {
		input.focus();
		input.setSelectionRange(chars, chars);
	} else if (input.createTextRange) {
		var range = input.createTextRange();
		range.collapse(true);
		range.moveEnd('character',chars);
		range.moveStart('character',chars);
		range.select();
	}
};

JAK.Suggest.prototype._startRequest = function() {
	if (this._timeout) { clearTimeout(this._timeout); }
	this._timeout = setTimeout(this._request, this._options.timeout);
};

JAK.Suggest.prototype._unlock = function() {
	this._hoverLock = false;
};

/**
 * Blur inputu. Pokud mame suggest, tak nic nedelame; pokud nemame a bezi request, zrusime ho.
 */
JAK.Suggest.prototype._blur = function(e) {
	if (this._timeout) {
		clearTimeout(this._timeout);
		this._timeout = null;
	}

	if (this._rq) {
		this._rq.abort();
		this._rq = null;
	}
};

JAK.Suggest.Item = JAK.ClassMaker.makeClass({
	NAME: "JAK.Suggest.Item",
	VERSION: "3.0"
});

JAK.Suggest.Item.prototype.$constructor = function(owner, value, highlightStart, highlightEnd) {
	this._owner = owner;
	this._dom = {};
	this._ec = [];

	this._value = value;
	this._highlightStart = highlightStart;
	this._highlightEnd = highlightEnd;

	this._build();
};

JAK.Suggest.Item.prototype.$destructor = function() {
	JAK.Events.removeListeners(this._ec);
};

JAK.Suggest.Item.prototype.getContainer = function() {
	return this._dom.container;
};

JAK.Suggest.Item.prototype.getValue = function() {
	return this._value;
};

JAK.Suggest.Item.prototype.getHighlightStart = function() {
	return this._highlightStart;
};

JAK.Suggest.Item.prototype.getHighlightEnd = function() {
	return this._highlightEnd;
};

JAK.Suggest.Item.prototype._build = function() {
	var p = JAK.mel("p", {className:"item"});

	p.innerHTML = this._highlight(this._value);

	this._dom.container = p;

	/* Tam kde máme podporu touch událostí, jich budeme přednostně využívat */
	if ("ontouchend" in window) {
		this._ec.push(JAK.Events.addListener(this._dom.container, "touchend", this, "_touchend"));
		this._ec.push(JAK.Events.addListener(this._dom.container, "touchstart", this, "_touchstart"));
	} else {
		this._ec.push(JAK.Events.addListener(this._dom.container, "click", this, "_click"));
		this._ec.push(JAK.Events.addListener(this._dom.container, "mouseover", this, "_over"));
	}
};

JAK.Suggest.Item.prototype._highlight = function(what) {
	var value = what;
	var start = this._highlightStart;
	var end = this._highlightEnd;

	if ((start || start === 0) && (end || end === 0)) {
		start = parseInt(start);
		end = parseInt(end);
		value = value.substring(0, start) + "<strong>" + value.substring(start, end) + "</strong>" + value.substring(end);
	}

	return value;
};

JAK.Suggest.Item.prototype._touchstart = function(e, elm) {
	JAK.Events.cancelDef(e);
};

JAK.Suggest.Item.prototype._touchend = function(e, elm) {
	this._owner.makeEvent("suggest-touch", {elm: elm, action: "click"});
	this._owner._highlight(this);
	this._click(e, elm);
};

JAK.Suggest.Item.prototype._click = function(e, elm) {
	this._owner._used = 2; /* klik mysi = plnohodnotne vyuziti suggestu */
	this._owner.makeEvent("suggest-mouse", {elm: elm, action: "click"});
	this.action();
};

JAK.Suggest.Item.prototype._over = function() {
	if (this._owner._hoverLock) { return; }
	this._owner._highlight(this);
};

/**
 * nastavení class na "active"
 */
JAK.Suggest.Item.prototype.hoverOn = function() {
	JAK.DOM.addClass(this._dom.container, "active");
};

/**
 * odstranění class "active"
 */
JAK.Suggest.Item.prototype.hoverOff = function() {
	JAK.DOM.removeClass(this._dom.container, "active");
};

JAK.Suggest.Item.prototype.action = function() {
	this._owner.getInput().value = this._value;
	this._owner.action();
};

JAK.Suggest.Item.prototype.isNavigable = function() {
	return true
};

JAK.Suggest.Item.prototype.highlightNavigateAction = function() {
	this._owner._dom.input.value = this.getValue();
};

JAK.Suggest.Item.prototype.rightNavigateAction = function() {
	this._owner._dom.input.value = this.getValue();
	this._owner._used = 2;
	this._owner._request();
};
