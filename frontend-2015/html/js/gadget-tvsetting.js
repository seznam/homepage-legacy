/* nstaveni jednotlivych okynek */
/* TV */
JAK.Gadget.TvSetting = JAK.ClassMaker.makeClass({
	NAME:"TvSetting",
	VERSION:"1.0"
});

JAK.Gadget.TvSetting.prototype.$constructor = function (feedId,parent) {
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

	// zobrazovani sekci
	var menu = JAK.DOM.getElementsByClass('tv-menu', this.form, 'div')[0];
	var links = menu.getElementsByTagName('li');

	for (var i = 0; i < links.length; i++) {
		JAK.Events.addListener(links[i], 'click', this, this._change);
	}

	// hlidani stenych polozek a prepinani modu
	var  items= this.form.getElementsByTagName('INPUT');
	for (var i = 0; i < items.length-2; i++) {
		if (i > 1) {
			JAK.Events.addListener(items[i], 'click', this, this._checkSame);
		} else {
			JAK.Events.addListener(items[i], 'click', this, this._changeMode);
		}
	}

	this.tvCont = JAK.DOM.getElementsByClass('tv-cont', this.form, 'div')[0];
};

JAK.Gadget.TvSetting.prototype.$destructor = function () {
	for (var i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Gadget.TvSetting.prototype.init = function (e, elm) {};

JAK.Gadget.TvSetting.prototype._change = function (e, elm) {
	var menu = JAK.DOM.getElementsByClass('tv-menu', this.form, 'div')[0];
	var menuUl = menu.getElementsByTagName('ul')[0];

	var selected = JAK.DOM.getElementsByClass('sel', menuUl, 'li')[0];
	selected.className = '';
	elm.className = 'sel';

	var list = JAK.DOM.getElementsByClass('tv-channels', this.form, 'div')[0];
	var ul = list.getElementsByTagName('ul');

	for (var i = 0; i < ul.length; i++) {
		ul[i].style.display = 'none';
	}

	JAK.gel('grplst_' + elm.id.split('_')[1]).style.display = 'block';
}

JAK.Gadget.TvSetting.prototype._changeMode = function (e, elm) {
	/*if (elm.value == '0') {
		this.tvCont.style.display = 'block';
	} else {
		this.tvCont.style.display = 'none';
	}*/
}

JAK.Gadget.TvSetting.prototype._checkSame = function (e, elm) {
	var  items= this.form.getElementsByTagName('INPUT');
	var id = elm.id.split('_')[0];

	for (var i = 2; i < items.length-2; i++) {
		if (items[i].id.split('_')[0] == id) {
			items[i].checked = elm.checked;
		}
	}
}

JAK.Gadget.TvSetting.prototype._send = function (e, elm) {
	JAK.Events.cancelDef(e);
	var  items= this.form.getElementsByTagName('INPUT');
	var channelIds = '';

	// typ zobrazeni
	if (items[0].checked) {
		channelIds += '&tvTipDisabled=0';
	} else {
		channelIds += '&tvTipDisabled=1';
	}

	// stanice
	var it = [];
	for(var i = 2; i < items.length; i++) {
		if (items[i].type == 'checkbox') {
			if (items[i].checked) {
				if (it.indexOf(items[i].value) == -1) {
					it.push(items[i].value);
				}
			}
		}
	}
	channelIds += (it.length > 0 ? '&userTv=' : '') + it.join('&userTv=');
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsSetupTvProcess', 'hashId=' + Homepage.CONF.HASHID + channelIds);
};

JAK.Gadget.TvSetting.prototype._close = function (e, elm) {
	this.parent.settings.closeSettings(e,elm);
};

JAK.Gadget.TvSetting.prototype._process = function(response) {
	var data = eval("("+response+")");
	if (data.status == 500) {
	} else if (data.status == 200) {
		this.data = data;
		if(data.method == 'setupTv') {
			this._finalize();
		}
	} else if(data.status == 401) {
		alert('Něco je špatně!');
	}
};

JAK.Gadget.TvSetting.prototype._finalize = function (data) {
	this._close();
	if(Homepage.CONF.ENABLE_SETTINS_RELOAD) {
		document.location.reload();
	}
};
/* end nastaveni TV */
