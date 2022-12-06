 /* nstaveni jednotlivych okynek */
/* RSS */
JAK.Gadget.RssSetting = JAK.ClassMaker.makeClass({
	NAME:"RssSetting",
	VERSION:"1.0"
});

JAK.Gadget.RssSetting.prototype.$constructor = function (feedId, parent, startNumber) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}
	this.eventsCache = new Object();
	this.feedId = feedId;
	this.parent = parent;
	this.startNumber = startNumber || 0; //index polozky(clanku), od ktere se to aktualizuje

	this.ext = null;
	if (arguments.length == 4) {
		this.ext = arguments[3];
	}
	this.cont = this.parent.settings.htmlSettings;

	if (!this.cont) {
		return
	}

	this.form = this.cont.getElementsByTagName('FORM')[0];
	/* naveseni akci */
	var submitB = JAK.DOM.getElementsByClass('submit', this.form, 'INPUT')[0];
	var resetB = JAK.DOM.getElementsByClass('reset', this.form, 'INPUT')[0];
	this.eventsCache.submitForm = JAK.Events.addListener(this.form, 'submit', this, '_send', false, true);
	this.eventsCache.resetB = JAK.Events.addListener(resetB, 'click', this, '_close', false, true);
};

JAK.Gadget.RssSetting.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Gadget.RssSetting.prototype.init = function () {};

JAK.Gadget.RssSetting.prototype._send = function (e, elm) {
	JAK.Events.cancelDef(e);
	var option = this.form['count'];
	var itemsNum = option.options[option.selectedIndex].value;

	var showPreview = (this.form['showPreview'].checked == true ? '1' : '0');
	this.showPreview = showPreview;
	var data = 'hashId=' + Homepage.CONF.HASHID + '&feedId=' + this.feedId + '&rowCount=' + itemsNum + '&showPreview=' + showPreview;

	// pro stream aktualni categorie
	if (this.ext != null) {
		var catId = '&catId=' + this.ext.getActualCategory();
		data += catId;
	}

	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this,'_process');
	rq.send('/jsSetupFeedProcess',data);
};

JAK.Gadget.RssSetting.prototype._close = function (e, elm) {
	if (this.cont) {
		this.parent.settings.closeSettings(e,elm);
	}
};

JAK.Gadget.RssSetting.prototype._process = function (response) {
	var data = eval("("+response+")");
	if(data.status == 500) {

	} else if(data.status == 200) {
		this.data = data;
		if(data.method == 'setupFeed') {
			this._finalize(data);
		}
	} else if(data.status == 401) {
		alert('Něco je špatně!');
	}
};

JAK.Gadget.RssSetting.prototype._finalize = function (data) {
	var items = this.data.items;

	var table = this.parent.htmlGadget.getElementsByTagName('table')[0];
	while (table.rows.length > this.startNumber) {
		table.deleteRow(table.rows.length-1);
	}
	
	if (items) {
		for (var i = this.startNumber, max = items.length; i < max; i++) {
			var tr = table.insertRow(table.rows.length);
			tr.setAttribute("data-dot", i+1);
			var td = tr.insertCell(0);
			
			if (items[i].isMainArticle) {
				JAK.DOM.addClass(td, 'top');
				var onclick = Number(data.userId)? 'onclick="JAK.log(this, \'rss-img\', ' + (i+1) + ', null, ' + this.feedId + ', ' + Number(data.userId) + ')"' : '';
				td.innerHTML = 
					'<div class="hlp">' +
						'<a href="' + items[i].link + '" data-dot="pic" class="top-foto-img" ' + onclick + '>' +
							'<img class="top-foto" src="' + items[i].seznam_image + '" width="' + items[i].picW + '" height="' + items[i].picH + '" alt="" />' +
						'</a>' +
						'<div class="text-box">' +
							'<strong>' +
								'<a data-dot="title" href="' + items[i].link + '" ' + onclick + '>' + items[i].title + '</a>' +
							'</strong>' +
							'<span class="perex">' + items[i].description + '</span>' +
						'</div>' +
					'</div>';
			} else {
				td.innerHTML = 
					'<div class="hlp">' +
						'<a href="' + items[i].link + '">' + items[i].title + '</a>' +
						'<span class="perex">' + items[i].description + '</span>' +
					'</div>';
			}
		}
	}	
	
	/*
	// stream
	if (this.ext != null) {
		this.ext.clear();
		this.ext.build(data);
	} else {
		var i = this.startNumber;
		if (items) {
			for(i; i < items.length; i++) {
				var tr = table.insertRow(table.rows.length);
				tr.setAttribute("data-dot", i+1);
				var td = tr.insertCell(0);
				//podminka pro video stream ktery ma vsude obrazky
				if (this.feedId == 194) {
					 var code = '<div class="hlp">';
										code += '<a href="'+items[i].link+'">'+items[i].title+'</a> <span class="perex">'+ items[i].description.substr(0,80) +'</span>'+
									'</div><div class="clear"></div>';
					td.innerHTML = code;
				} else {
					td.innerHTML = '<div class="hlp"><a href="'+items[i].link+'"><span></span>'+items[i].title+'</a> <span class="perex">'+ items[i].description +'</span></div>';
				}
			}
		}
	}
	*/

	this._close();
};
/* end nastaveni RSS */
