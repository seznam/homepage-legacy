/**
 * @overview Sledování, jak je našeptávač používán
 * @version 0.7
 */

/**
 * @class Třída sledující použití našeptávače
 */
JAK.SuggestUsage = JAK.ClassMaker.makeClass({
	NAME: "JAK.SuggestUsage",
	VERSION: "0.7",
	IMPLEMENT: JAK.ISignals
});

/**
 * @constant
 * Využití našeptávače
 */
JAK.SuggestUsage.USE = {
	ENTER: "e", /* Uživatel stiskl Enter */
	BTN_SEARCH: "b", /* Uživatel klikl na tlačítko "Hledej" */
	SELECT_BY_KEYBOARD: "k", /* Uživatel vybral návrh z našeptávače pomocí klávesnice */
	CLICK_ON: "c", /* Uživatel proklikl návrh z našeptávače */
	TOUCH_ON: "d", /* Uživatel tapl návrh z našeptávače */
	APPEND_RARROW: "r", /* Uživatel použil šipku doprava */
	APPEND_CLICK: "a", /* Uživatel klik na šedé slovo */
	APPEND_TOUCH: "t", /* Uživatel tapl na šedé slovo */
	EDIT_SWIPE: "s" /* Uživatel přejel návrh z našeptávače (pro editaci) */
}

/**
 * @param {object} JAK.Suggest
 * @param {string} [options.paramName="su"] ma-li se pouzit prefixove hledani, neexistuje-li input, bude vytvořen
 * @param {object} [options.submit=null] submit tlačítko
 */
JAK.SuggestUsage.prototype.$constructor = function(suggest, options) {
	this._sc = [];
	this._ec = [];
	this._params = {};
	this._paramsString = "";
	this._use = JAK.SuggestUsage.USE;
	this._options = {};

	/* nastavení */
	for (var p in options) { this._options[p] = options[p]; }

	this._sc.push(this.addListener("suggest-keyboard", "_suggestKeyboad", suggest));
	this._sc.push(this.addListener("suggest-mouse", "_suggestMouse", suggest));
	this._sc.push(this.addListener("suggest-touch", "_suggestTouch", suggest));
	this._sc.push(this.addListener("suggest-button", "_clickOnButton", suggest));
};

/**
 * @destructor
 */
JAK.SuggestUsage.prototype.$destructor = function() {
	this.removeListeners(this._sc);
	JAK.Events.removeListeners(this._ec);
};

/**
 * Vrací sledovaný parametr našeptávače
 * @param {string} [usage] jaký sledovaný parametr chceme vrátit, pokud není zadaný, vrací všechny
 * @returns {bool|object} viz param usage
 */
JAK.SuggestUsage.prototype.getUsage = function(usage) {
	if (arguments.length == 0) { return this._params; }
	return (this._params[usage] == undefined) ? false : this._params[usage];
};

/**
 * Vrací sledovaný parametr našeptávače
 * @returns {bool|object} viz param usage
 */
 JAK.SuggestUsage.prototype.getUsageString = function() {
	return this._paramsString;
};

/**
 * Zpracování signálů od našeptávače a jejich zaznamenání
 * @param {object} e - objekt s daty signálu
 */
JAK.SuggestUsage.prototype._suggestKeyboad = function(e) {
	var code = e.data.code;
	switch (code) {
		case 13: /* enter */
			this._params["ENTER"] = true;
			this._build();
		break;
		case 39: /* šipka vpravo */
			if (e.data.addWord) { this._params["APPEND_RARROW"] = true; }
		break;
		case 38: /* šipka nahoru */
		case 40: /* šipka dolů */
			this._params["SELECT_BY_KEYBOARD"] = true;
		break;
	}
};

/*
 * Zpracování signálů od našeptávače a jejich zaznamenání
 */
JAK.SuggestUsage.prototype._suggestMouse = function(e) {
	var action = e.data.action;
	switch (action) {
		case "click":
			this._params["CLICK_ON"] = true;
			this._build();
		break;
		case "append":
			this._params["APPEND_CLICK"] = true;
		break;
	}
};

/*
 * Zpracování signálů od našeptávače a jejich zaznamenání
 */
JAK.SuggestUsage.prototype._suggestTouch = function(e) {
	var action = e.data.action;
	switch (action) {
		case "click":
			this._params["TOUCH_ON"] = true;
			this._build();
		break;
		case "swipe":
			this._params["EDIT_SWIPE"] = true;
		break;
		case "append":
			this._params["APPEND_TOUCH"] = true;
		break;
	}
};

/*
 * Zpracování signálů od našeptávače a jejich zaznamenání
 */
JAK.SuggestUsage.prototype._clickOnButton = function() {
	this._params["BTN_SEARCH"] = true;
	this._build();
};

/* 
 * Vyrobení řetězce (stringu) podle událostí našeptávače
 */
JAK.SuggestUsage.prototype._build = function() {
	var using = "";
	for ( var p in this._params ) {
		var keyCode = this._use[p];
		if ( this._params[p] && keyCode ) using += keyCode;
	}

	this._paramsString = using;
};

/* 
 * Zresetuje používání našeptávače
 */
JAK.SuggestUsage.prototype.clear = function() {
	this._params = {};
	this._paramsString = "";
};