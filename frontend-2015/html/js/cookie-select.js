/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/


/**
 * @class Nastavení superSelectu dle cookie hodnoty
 * @version 1.0
 */   
JAK.CookieSelect = JAK.ClassMaker.makeClass({
	NAME: "JAK.CookieSelect",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals]
});

/**
 * @constructor
 * @param {object} opt konfiguracni objekt
 * @param {integer} opt.selectId id daného selecut 
 * @param {string} opt.cookieName nazev cookie
 * @param {integer} opt.formId id odesílaného formu
 * @param {integer} opt.timeHours pocet hodin platnosti cookie
 **/
JAK.CookieSelect.prototype.$constructor = function(opt){
	
	this.sS 			= null;															/** instance super selectu **/
	this.fC				= null;															/** pro nastavení a odebrání listeneru **/
	
	this.opt 			= {
							selectId: null,
							cookieName : null,
							formId: null,
							timeHours: null
						 };
	
	for (var p in opt) { this.opt[p] = opt[p]; }										/** nastaveni hodnot dle argumentu **/
	
	this.cookie 		= JAK.Cookie.getInstance();										/** instance pro spravu cookies, /js/lib/cooke.js a zjisteni povoleni nastavovani cookie **/
	this.selectElm		= JAK.gel(this.opt.selectId); 									/** element select pro vyber domen **/
	this.selectValue 	= this.cookie.get(this.opt.cookieName);							/** domena vybrana pri poslednim prihlaseni dle cookies **/

	this._loadSuperSelect();
	this.fC = JAK.Events.addListener(JAK.gel(this.opt.formId),'submit', this, '_setListener');  	/** nastaveni listeneru na odeslani formu **/
	this.sC = this.addListener("change", this._onSelectChange.bind(this));

	this._cbks = {
		onChange: []
	};
};

JAK.CookieSelect.prototype.onChange = function(cbk) {
	this._cbks.onChange.push(cbk);
};

JAK.CookieSelect.prototype.getValue = function() {
	return this.sS[0].getValue();
};

/**
 * nastavení vybrane polozky dle cookie z minuleho prihlaseni
 **/
JAK.CookieSelect.prototype._setSelected = function(){
	if (this.selectValue != null ) { 
		for(i=0; i<this.selectElm.length; i++) { if(this.selectElm.options[i].value == this.selectValue) { break; } }
		this.selectElm.options.selectedIndex = i;
	}
};

/**
 * nacteni super selectu
 **/
JAK.CookieSelect.prototype._loadSuperSelect = function(){
	this._setSelected();
	this.sS = JAK.SuperSelect.replaceAllSelects(this.opt.formId);
};

/**
 * nastaveni listeneru na odeslani formu a ukladani cookies
 **/
JAK.CookieSelect.prototype._setListener = function(){
	if (this.selectValue == null || this.selectValue != this.sS[0].getValue()) {
		var expires = new Date ();
		expires.setHours(expires.getHours() + this.opt.timeHours);
		this.cookie.set(this.opt.cookieName,this.sS[0].getValue(),{expires:expires});
	}
};

JAK.CookieSelect.prototype._onSelectChange = function(e) {
	var target = e.target;

	if (target != this.sS[0]) { return; }

	this._cbks.onChange.forEach(function(cbk) {
		return cbk(this.sS[0].getValue());
	}.bind(this));
};

/**
 * destructor
 **/
JAK.CookieSelect.prototype.$destructor = function(){
	if(this.fC){ JAK.Events.removeListener(this.fC); }
	for(var p in this){
		this[p] = null;
	}
};