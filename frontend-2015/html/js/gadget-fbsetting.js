/* nstaveni jednotlivych okynek */
/* FB */
JAK.Gadget.FBSetting = JAK.ClassMaker.makeClass({
	NAME:"FBSetting",
	VERSION:"1.0"
});

JAK.Gadget.FBSetting.prototype.$constructor = function (feedId, parent, startNumber) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}
	this.eventsCache = new Object();
	this.feedId = feedId;
	this.parent = parent;
	this.startNumber = startNumber;

	var cont = this.parent.settings.htmlSettings;
	this.form = cont.getElementsByTagName('FORM')[0];
	/* naveseni akci */
	var submitB = JAK.DOM.getElementsByClass('submit', this.form, 'INPUT')[0];
	var resetB = JAK.DOM.getElementsByClass('reset', this.form, 'INPUT')[0];
	this.eventsCache.submitForm = JAK.Events.addListener(this.form, 'submit', this, '_send', false, true);
	this.eventsCache.resetB = JAK.Events.addListener(resetB, 'click', this, '_close', false, true);
};

JAK.Gadget.FBSetting.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Gadget.FBSetting.prototype.init = function () {};

JAK.Gadget.FBSetting.prototype._send = function (e, elm) {
	JAK.Events.cancelDef(e);
	var option = this.form['count'];
	this.itemsNum = option.options[option.selectedIndex].value;


	var showPreview = (this.form['showPicture'].checked == true ? '1' : '0');
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsSetupFacebookProcess', 'hashId=' + Homepage.CONF.HASHID + '&feedId=' + this.feedId + '&rowCount=' + this.itemsNum + '&showPicture=' + showPreview);
};

JAK.Gadget.FBSetting.prototype._close = function (e, elm) {
	this.parent.settings.closeSettings(e,elm);
};

JAK.Gadget.FBSetting.prototype._process = function(response) {
	var data = eval("("+response+")");
	if (data.status == 200) {
		var fb = this.parent.extGadg;
		fb.fbPictureShow = parseInt(data.pictureShow);
		fb.itemsCount = this.itemsNum; /* protoze replikace na serveru je pomala :-) */
		fb.page = 0;
		fb._blist();
		this._close();
	} else {
		alert('Něco je špatně!');
	}
};
