/* Pocasi */
JAK.Gadget.WeatherSetting = JAK.ClassMaker.makeClass({
	NAME:"WeatherSetting",
	VERSION:"1.0"
});

JAK.Gadget.WeatherSetting = function (feedId,parent) {
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

	this.openLink = JAK.gel('weather-district-block');

	this.eventsCache.submitForm = JAK.Events.addListener(this.form, 'submit', this, '_send', false, true);
	this.eventsCache.resetB = JAK.Events.addListener(resetB, 'click', this, '_close', false, true);

	this.autoDetectChbx = this.form['auto_detect'];
	this.countryS = this.form['county'];
	this.districtS = this.form['district'];
	this.eventsCache.autoDetectChbx = JAK.Events.addListener(this.autoDetectChbx, 'click', this, '_toggle', false, true);
	this.eventsCache.countryS = JAK.Events.addListener(this.countryS, 'change', this, '_getCities', false, true);
	this.eventsCache.openLink = JAK.Events.addListener(this.openLink, 'click', this.parent.settings, this.parent.settings.openSettings, false, true);
	this._toggle();
};

JAK.Gadget.WeatherSetting.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Gadget.WeatherSetting.prototype.init = function () {};

JAK.Gadget.WeatherSetting.prototype._toggle = function () {
	if (this.autoDetectChbx && this.autoDetectChbx.checked) {
		this.countryS.disabled = true;
		JAK.DOM.addClass(this.countryS.parentNode, 'disabled');
		this.districtS.disabled = true;
		JAK.DOM.addClass(this.districtS.parentNode, 'disabled');
	} else {
		this.countryS.disabled = false;
		JAK.DOM.removeClass(this.countryS.parentNode, 'disabled');
		this.districtS.disabled = false;
		JAK.DOM.removeClass(this.districtS.parentNode, 'disabled');
	}
}

JAK.Gadget.WeatherSetting.prototype._getCities = function () {
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsWeatherGetCities','hashId=' + Homepage.CONF.HASHID + '&countyId=' + this.countryS.options[this.countryS.selectedIndex].value);
}

JAK.Gadget.WeatherSetting.prototype._send = function (e, elm) {
	JAK.Events.cancelDef(e);

	var districtId = this.autoDetectChbx.checked ? '' : this.districtS.options[this.districtS.selectedIndex].value;

	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsSetupWeatherProcess', 'hashId=' + Homepage.CONF.HASHID + '&districtId=' + districtId);
};

JAK.Gadget.WeatherSetting.prototype._close = function (e, elm) {
	this.parent.settings.closeSettings(e,elm);
};

JAK.Gadget.WeatherSetting.prototype._process = function(response) {
	var data = eval("("+response+")");
	if(data.status == 500) {

	} else if(data.status == 200) {
		this.data = data;
		if(data.method == 'getCities') {
			this._fillCites();
		} else if('setupWeather') {
			this._finalize();
		}
	} else if(data.status == 401) {
		alert('Něco je špatně!');
	}
};

JAK.Gadget.WeatherSetting.prototype._fillCites = function () {
	while (this.districtS.childNodes.length != 0) {
		this.districtS.removeChild(this.districtS.firstChild);
	}
	/* naplnime mesty */
	var districts = this.data.districts;
	for(var i = 0; i < districts.length; i++) {
		var opt = new Option();
		opt.value = districts[i].id;
		opt.text = districts[i].name;
		this.districtS.options[this.districtS.options.length] = opt;
	}

};

JAK.Gadget.WeatherSetting.prototype._finalize = function () {
	this._close();
	if(Homepage.CONF.ENABLE_SETTINS_RELOAD) {
		document.location.reload();
	}
};
/* end weather */
