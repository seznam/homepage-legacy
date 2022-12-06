/**
 * @class
 * JAK.Homepage.Seek nastaveni hledani
 * @augments JAK.Homepage.AbstractSetting
 * @see JAK.Homepage.AbstractSetting
 * @property {JAK.Homepage.Advanced.Seek.Search[]} searchComponents pole objektu reprezentujici jednotliva hledani
 * @property {int} tabsBolded pocet viditelnych zalozek
 */
JAK.Homepage.Advanced.Seek = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.Advanced.Seek",
	VERSION:"1.0",
	EXTEND: JAK.Homepage.AbstractSetting
})

JAK.Homepage.Advanced.Seek.prototype.$constructor = function (html) {
	this.dom = {};
	this.ev = {};
	this.settings = {};
	this.html = html;
	this.searchComponents = [];
	this.requestCount = 1;
	this.tabsBolded = Homepage.CONF.SEARCH_TAB_COUNT;

	this._build();
}

/**
 * vola metodu <b>_getData()</b> pro ziskani informaci ze serveru
 * @see JAK.Homepage.AbstractSetting#_build
 */
JAK.Homepage.Advanced.Seek.prototype._build = function () {
	this.dom.html =
	'<div id="seek-list"></div>'+
	'<div class="clear"></div>'+
	'<div id="seek-add"></div>'+
	'<div class="clear"></div>';

	this.html.innerHTML = this.dom.html;
	this.dom.seekList = JAK.gel('seek-list');
	this.dom.seekAdd = JAK.gel('seek-add')

	this._getData();
}

/**
 * ziskame data o hledani a volame metodu <b>_responseBuildSeek()</b>
 * @private
 */
JAK.Homepage.Advanced.Seek.prototype._getData = function () {
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_responseBuildSeek');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsSearchList', 'hashId=' + Homepage.CONF.HASHID);
}

/**
 * vyrabi jednotliva hledani a pridava je do pole <b>searchComponents</b>,
 * navic vyrabi instanci z <b>JAK.Reorder</b> pro razeni prvku hledani
 * @private
 */
JAK.Homepage.Advanced.Seek.prototype._responseBuildSeek = function (data) {
	eval('var data = ('+data+')');
	JAK.loader.quickHide();
	this.items = data.items;
	for (var i=0; i < data.items.length; i++) {
		this.searchComponents.push(new JAK.Homepage.Advanced.Seek.Search(i, this.dom.seekList, data.items[i], this));
		if (i == 0) {
			this.searchComponents[this.searchComponents.length-1].hide();
		}
	}

	this.reorder = new JAK.Reorder(this.dom.seekList, {handleClass: 'seek-drag', direction: 'y'}, this, "_update");

	//this.mySeek = new JAK.Homepage.Advanced.Seek.MySearch(this.dom.seekAdd, this);

	this._setMark();
};

/**
 * vyrobi jedno hledani a prida je do pole <b>searchComponents</b> na konec
 * @param {object} item objekt reprezentujici jedno hledani
 * @param {bool} new je to nove hledani (moje)?
 */
JAK.Homepage.Advanced.Seek.prototype.addItem = function (item, newMyItem) {
	this.reorder.$destructor();
	this.items.push(item);
	this.searchComponents.push(new JAK.Homepage.Advanced.Seek.Search(this.searchComponents.length, this.dom.seekList, item, this, true));
	this.reorder = new JAK.Reorder(this.dom.seekList, {handleClass: 'seek-drag', direction: 'y'}, this, "_update");

}

/**
 * aktualizuje pole s poradim hledani po pretahnuti polozky
 * @private
 * @param {int[]} pole s aktualnim poradim hledani
 */
JAK.Homepage.Advanced.Seek.prototype._update = function (arr, dragId) {
	// najdu presunutou polozku v poli arr
	dragId = arr.indexOf(dragId);
	var tmp = [];
	var tmpComp = []
	/*var ids =[];
	var hiddens =[]*/

	for( var i = 0; i < arr.length; i++) {
 		tmp.push(this.items[arr[i]]);
		tmpComp.push(this.searchComponents[arr[i]]);
		/*ids.push(this.items[arr[i]].userSearchId);
		hiddens.push(this.items[arr[i]].isHidden);*/
 	}

	this.searchComponents[arr[dragId]].startFade();
	this.items = tmp;
	this.searchComponents = tmpComp;

	this._setMark();

};

/**
 * @see JAK.Homepage.InterfaceSettings#submit
 */
JAK.Homepage.Advanced.Seek.prototype.submit = function (_submitCallBack) {
	this._submitCallBack = _submitCallBack;
	var ids =[];
	var hiddens =[];
	for( var i = 0; i < this.items.length; i++) {
		ids.push(this.items[i].userSearchId);
		hiddens.push(this.items[i].isHidden == '' ? 0 : this.items[i].isHidden);
	}

	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_response');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsSetupSearchProcess', 'hashId=' + Homepage.CONF.HASHID + '&id=' + ids.toString() +'&isHidden=' + hiddens.toString());
};

/**
 * @see JAK.Homepage.AbstractSetting#_response
 */
JAK.Homepage.Advanced.Seek.prototype._response = function (data) {
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

	this.makeEvent('settingsSaved', {'name': this.constructor.NAME, 'message': this.data});
};

/**
 * nastavuje vlastnost isHidden, pouze Fulltext je porad viditelny => index je od 1
 * @param {int} searchId ID nastavovaneho hledani
 * @param {int} state hodnota
 */
JAK.Homepage.Advanced.Seek.prototype.setVisibility = function (searchId, state) {
	// od 1 fulltext nejde schovat
	for (var i = 1; i < this.items.length; i++) {
		if (this.items[i].searchId == searchId) {
			this.items[i].isHidden = state;
			break;
		}
	}
	this._setMark();
};

/**
 * smaze polozku
 * @param {object} item ID odkaz na mazanou polozku
 */
JAK.Homepage.Advanced.Seek.prototype.deleteItem = function (item) {
	for (var i = 1; i < this.items.length; i++) {
		if(item.data.searchId == this.items[i].searchId) {
			this.items.splice(i,1);
			this.searchComponents.splice(i,1);
		}
	}
	item.$destructor();
	this._setMark();
}

/**
 * oznacuje polozky ktere jsou videt jako taby
 * @private
 */
JAK.Homepage.Advanced.Seek.prototype._setMark = function () {
	var boldCount = 0;
	for (var i = 1; i < this.searchComponents.length; i++) {
		if (this.searchComponents[i].data.isHidden != 1) {
			boldCount++;
			if (boldCount <= this.tabsBolded) {
				this.searchComponents[i].setBold(true);
			} else {
				this.searchComponents[i].setBold(false);
			}

		} else {
			this.searchComponents[i].setBold(false);
		}
	}
}
