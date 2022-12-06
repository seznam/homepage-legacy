/**
 * @class
 * trida poskytujici funkcionalitu pro nastaveni naseptavace
 * @augments JAK.Homepage.AbstractSetting
 * @see JAK.Homepage.AbstractSetting
 * @param {object} html odkaz na HTML strukturu
 * @param {int} suggest hodnota predana z aplikace (0,1) informujici o stavu sg
 */
JAK.Homepage.Advanced.Suggest = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.Advanced.Suggest",
	VERSION:"1.0",
	EXTEND: JAK.Homepage.AbstractSetting
})

JAK.Homepage.Advanced.Suggest.prototype.$constructor = function (html, suggest) {
	this.dom = {};
	this.ev = {};
	this.settings = {};
	this.html = html;
	this.settings.suggest = suggest;

	this._build();
}

/**
 * vytvori HTML strukturu
 * @param {object} html odkaz na HTML strukturu
 * @private
 */
JAK.Homepage.Advanced.Suggest.prototype._build = function (html) {
	this.dom.input = JAK.cel('input', null, 'suggest');
	this.dom.input.type = 'checkbox';
	this.dom.input.name = 'suggest';
	this.dom.input.checked = this.settings.suggest ? 'checked' : '';

	this.dom.label = JAK.cel('label');
	this.dom.label.htmlFor = 'suggest';
	this.dom.label.innerHTML = 'zapnout našeptávač';

	JAK.DOM.append([this.html,this.dom.input,this.dom.label]);
}

/**
 * @see JAK.Homepage.InterfaceSettings#submit
 */
JAK.Homepage.Advanced.Suggest.prototype.submit = function (_submitCallBack) {
	this._submitCallBack = _submitCallBack;
	this.settings.suggest = (this.dom.input.checked ? '1' : '0');

	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_response');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsSetupSuggest', 'hashId=' + Homepage.CONF.HASHID + '&suggest=' + this.settings.suggest);
}
