/* Zodiac */
JAK.Gadget.ZodiacSetting = JAK.ClassMaker.makeClass({
	NAME:"ZodiacSetting",
	VERSION:"1.0"
});

JAK.Gadget.ZodiacSetting.prototype.$constructor = function (feedId,parent) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}
	this.eventsCache = new Object();
	this.feedId = feedId;
	this.parent = parent;

	var cont = this.parent.settings.htmlSettings;
	this.form = cont.getElementsByTagName('FORM')[0];
	/* naveseni akci */
	var submitB = JAK.DOM.getElementsByClass('submit', this.form, 'INPUT')[0];
	var resetB = JAK.DOM.getElementsByClass('reset', this.form, 'INPUT')[0];

	this.eventsCache.submitForm = JAK.Events.addListener(this.form, 'submit', this, '_send', false, true);
	this.eventsCache.resetB = JAK.Events.addListener(resetB, 'click', this, '_close', false, true);

	this.zodiacS = this.form['zodiac'];
};

JAK.Gadget.ZodiacSetting.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Gadget.ZodiacSetting.prototype.init = function () {};

JAK.Gadget.ZodiacSetting.prototype._send = function (e, elm) {
	JAK.Events.cancelDef(e);
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsSetupZodiacProcess', 'hashId=' + Homepage.CONF.HASHID + '&zodiacId=' + this.zodiacS.options[this.zodiacS.selectedIndex].value);
};

JAK.Gadget.ZodiacSetting.prototype._close = function (e, elm) {

	this.parent.settings.closeSettings(e,elm);
};

JAK.Gadget.ZodiacSetting.prototype._process = function (response) {
	var data = eval("("+response+")");
	if(data.status == 500) {

	} else if(data.status == 200) {
		this.data = data;
		if (data.method == 'setupZodiac') {
			this._finalize();
		}
	} else if(data.status == 401) {
		alert('Něco je špatně!');
	}
};

JAK.Gadget.ZodiacSetting.prototype._finalize = function () {
	this._close();
	if(Homepage.CONF.ENABLE_SETTINS_RELOAD) {
		document.location.reload();
	}
};
