/* spravce gadgetu - jejich aktualizace */
JAK.GadgetManager = JAK.ClassMaker.makeClass({
	NAME:"GadgetManager",
	VERSION:"1.0"
});

JAK.GadgetManager = function () {
	this.gadgets = {};

	this._startAct = this._startActTMP.bind(this);
};

JAK.GadgetManager.prototype.destructor = function () {
	window.clearInterval(this.timer);
};

JAK.GadgetManager.prototype.addItem = function (gadget) {
	var obj = {
		gadget : gadget
	}
	this.gadgets['gadget-' + gadget.feedId] = obj;
};

JAK.GadgetManager.prototype.init = function (gadget) {
	if (Homepage.CONF.USERID > 0) {
		this.timer = window.setInterval(this._startAct, Homepage.CONF.UPDATE_INTERVAL*1000);
	} else {
		this.timer = window.setInterval(this._startAct, Homepage.CONF.UPDATE_INTERVAL_ANONYM*1000);
	}
};

JAK.GadgetManager.prototype._startActTMP = function () {
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsGetContent');
	try {
		if( JAK.gadget3ec ){
			/* pokud je uzivatel z emailu odhlaseny, neprovadi se request */
			if(!JAK.gadget3ec.forbidden) {
				JAK.gadget3ec.sendRequest();
			}
		}
	} catch(e){}
};

JAK.GadgetManager.prototype._process = function (response) {
	eval('var data = ('+response+')');
	if(data.status == 500) {

	} else if(data.status == 200) {
		this.data = data;
		if(data.method == 'getContent') {
			this._actualize();
		}
	}
};

JAK.GadgetManager.prototype._actualize = function () {
	var feeds = this.data.feeds;

	for (var i = 0; i < feeds.length; i++) {
		if(!feeds[i]) return;
		
		var refObj = this.gadgets['gadget-' + feeds[i].feedId];
		var newsFeeds = ['rss', 'novinky', 'super', 'sport', 'prozeny'];
		if (newsFeeds.indexOf(feeds[i].typeId) != -1) {
			refObj.gadget.extSetting.data = this.data.feeds[i];
			refObj.gadget.extSetting._finalize(this.data.feeds[i]);

		} else if (feeds[i].typeId == 'foreignemail') {
			refObj.gadget.extSetting.data = this.data.feeds[i];
			refObj.gadget.extSetting._finalize(this.data.feeds[i]);

		/*} else if (feeds[i].typeId == 'email') {
			refObj.gadget.extSetting.data = this.data.feeds[i];
			refObj.gadget.extSetting._finalize(this.data.feeds[i]);
		*/
		} else if (feeds[i].typeId == 'television') {
			var tv = refObj.gadget.extGadg;
			if (tv) {
				tv.data = this.data.feeds[i];
				tv.change();
			}

			/*var slot = refObj.gadget.extGadg.timesArray[0];
			if (refObj.gadget.extGadg.active == slot) {
				slot.data = this.data.feeds[i];
				slot._change();
			}*/

		}
	}
    // aktualizace hash ID
    Homepage.CONF.HASHID = this.data.hashid;
};

JAK.gadgetManager = new JAK.GadgetManager();
