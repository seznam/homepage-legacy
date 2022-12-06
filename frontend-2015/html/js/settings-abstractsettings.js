/**
 * @class
 * abstraktni trida pro tridy reprezentuji jednotliva nastaveni.
 * Definuje zakladni metody
 * @augments JAK.ISignals
 * @augments JAK.Homepage.InterfaceSettings
 * @property {obect} settings popisuje data odesilana na server
 * @property {int} requestCount definuje pocet requestu, ktere trida odesle pri
 * ukladani nastaveni
 * @property {object} html odkaz na DOM strukturu ve strance
 * @property {object} rq instance z XHR tridy umoznujici komunikaci
  * @signal settingsSaved
 */
JAK.Homepage.AbstractSetting = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.AbstractSetting",
	VERSION:"1.0",
	IMPLEMENT: [JAK.ISignals, JAK.Homepage.InterfaceSettings]
})

JAK.Homepage.AbstractSetting.prototype.$constructor = function () {
	this.dom = {}; // zasobnik html elementu
	this.ev = {}; // zasobnik udalosti
	this.settings = {}; // zasobnik nastaveni
	this.requestCount = 0 // pocet requestu pri ulozeni
	this.html = JAK.gel(html);

}

/**
 * vola metodu _createHTML
 * @private
 */
JAK.Homepage.AbstractSetting.prototype._build = function () {
	this._createHTML();
}

/**
 * vyrobi HTML kod pro dane nastaveni
 * @private
 */
JAK.Homepage.AbstractSetting.prototype._createHTML = function () {

}

/**
 * odesila data na server
 * @private
 */
JAK.Homepage.AbstractSetting.prototype._send = function () {

}

/**
 * zpracuje odpoved ze serveru a vytvori udalost <b>settingsSaved</b>
 * @private
 * @param {object} data data ziskana ze serveru
 */
JAK.Homepage.AbstractSetting.prototype._response = function (data) {
	if (data == '') {
		return 0;
	} else {
		eval('var data = ('+data+')');
	}

	JAK.loader.quickHide();
	var message = '';
	if (data.status == 500) {
		this.data = data;
	} else if (data.status == 200) {
		this.data = data;
		if (data.method == 'confirm') {
			this.data = data;
		}
	} else if (data.status == 401) {
		alert('Něco je špatně!');
	}

	if (typeof this._submitCallBack != 'undefined') {
		this._submitCallBack();
	}

	this.makeEvent('settingsSaved', {'name': this.constructor.NAME, 'message': this.data});
}

/**
 * vysila udalost <b>settingsChanged</b> kdyz dojde ke zmene v nastaveni
 * @private
 */
JAK.Homepage.AbstractSetting.prototype._change = function () {
	this.makeEvent('settingsChanged');
}

/**
 * zobrazuje chyby
 * @private
 */
JAK.Homepage.AbstractSetting.prototype._error = function () {

}
