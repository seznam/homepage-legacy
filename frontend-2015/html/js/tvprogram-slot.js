/* time */
JAK.TvProgram.Slot = JAK.ClassMaker.makeClass({
	NAME:"Slot",
	VERSION:"1.0"
});
JAK.TvProgram.Slot.prototype.$constructor = function (timeId, parent) {
	this.timeId = timeId;

	this.eventsCache = new Object();
	this.parent = parent;
	// udelame title
	this._create();
}

JAK.TvProgram.Slot.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.TvProgram.Slot.prototype.init = function () {};

JAK.TvProgram.Slot.prototype._create = function () {
	this.title = JAK.cel('a');
	this.title.href = "";

	if (this.timeId == 'now') {
		if (this.parent.type == 'now') {
			this.title.className = 'act';
		}
			this.title.title ="Kliknutím zobrazíte pořady, které právě běží";
		this.title.innerHTML ="Právě běží";
	} else {
		var t1 = this.timeId.split('_')[0];
		var t2 = this.timeId.split('_')[1];

		if(t1.indexOf('24') == -1) {
			this.title.title='Kliknutím zobrazíte pořady vysílané  mezi ' + t1.substring(0,2) + ' a ' + t2.substring(0,2) + ' hodinou';
			this.title.innerHTML = t1.substring(0,2) + ':' + t1.substring(2,4)
		} else {
			this.title.title='Kliknutím zobrazíte pořady vysílané  mezi 00:00 a 02:00 hodinou';
			this.title.innerHTML = '00:00';
		}
	}
	this.parent.times.appendChild(this.title);


	// spany -> a
	var table = this.parent.tvTable;
	var spans = JAK.DOM.getElementsByClass('tvlink', table, 'SPAN');

	for(var i = 0; i < spans.length; i++) {
		var a = JAK.cel('a');
		a.className = spans[i].className;
		a.id = spans[i].id;
		a.href = '#';
		a.innerHTML = spans[i].innerHTML;
		spans[i].parentNode.replaceChild(a,spans[i]);
		this.eventsCache['tvlinks'+i] = JAK.Events.addListener(a, 'click', this, '_show', false, true);
	}

	// u posledniho nic nepridam
	if (this.timeId != '2200_2400') {
		var mezera = JAK.ctext();
		mezera.data = ' - ';
		this.parent.times.appendChild(mezera);
	}

	this.eventsCache.title = JAK.Events.addListener(this.title, 'click', this, '_send', false, true);
};

JAK.TvProgram.Slot.prototype._send = function (e, elm) {
	JAK.Events.cancelDef(e);
	if (elm.className == 'act') {
		return
	}

	if (elm.innerHTML == 'TV tip') {
		this.parent.type = 'now';
	}

	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsTvGetChannels', 'hashId=' + Homepage.CONF.HASHID + '&type='+ this.timeId);
};

JAK.TvProgram.Slot.prototype.change = function () {
	this.data = this.parent.data;
	var table = this.parent.tvTable;
	if (this.type == 'tips') {

	} else {
		// mazu navesene udaloti aktivniho slotu
		for (var i in this.eventsCache) {
			if (i.indexOf('tvlinks') != -1) {
				JAK.Events.removeListener(this.eventsCache[i]);
			}
		}

		while(table.rows.length > 0) {
			table.deleteRow(table.rows.length-1);
		}
		/* pro jistotu smazem i to co tam zustane */
		while(table.childNodes.length > 0) {
			table.removeChild(table.childNodes[0]);
		}

		for (var i = 0; i < this.data.items.length; i++) {
			// kdyz su v aktualnich casech
			if(this.timeId != 'now') {
				// kdyz je to rozdilne tak titulek casu
				if(this.actChnl != this.data.items[i].channel){
					var trChnl = table.insertRow(table.rows.length);
					var tdChnl = trChnl.insertCell(0);
					tdChnl.colSpan = 2;
					tdChnl.className = 'channel';
					tdChnl.innerHTML = this.data.items[i].channel;
				}
			}

			var tr = table.insertRow(table.rows.length);
			var td1 = tr.insertCell(0);

			if	(this.timeId == 'now') {
				td1.className ='bars';
				td1.title = 'Již uběhlo ' + this.data.items[i].progress + '% od začátku vysílání.';
				td1.innerHTML = '<div class="proc-text">' + this.data.items[i].time + '</div><div class="bar"><div class="progres" style="width:' + this.data.items[i].progress + '%;"></div></div><div class="proc-text">' + this.data.items[i].timeTo + '</div>';
			} else {
				td1.className ='time';
				td1.innerHTML = this.data.items[i].time;
			}

			var td2 = tr.insertCell(1);
			td2.innerHTML = '<a href="" id="tv_' + i + '_' + this.data.items[i].channelId + '_' + this.data.items[i].time.replace(':','-')+'_' + this.data.items[i].idPrg + '">' + this.data.items[i].title + '</a> ' +  ' - ' + this.data.items[i].channel;

			var a = td2.getElementsByTagName('a')[0];
			this.eventsCache['tvlinks'+i] = JAK.Events.addListener(a, 'click', this, '_show', false, true);

			this.actChnl = this.data.items[i].channel;
			}
		this.parent.active.title.className = '';
		this.parent.active = this.parent.act = this;
		this.title.className = 'act';
	}
};

JAK.TvProgram.Slot.prototype._show = function (e, elm) {
	JAK.Events.cancelDef(e);

	this.clickedElm = elm;
	var params = elm.id.split('_');
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsTvDescription', 'hashId=' + Homepage.CONF.HASHID + '&id='+ params[4]);
};


JAK.TvProgram.Slot.prototype._showDesc = function () {
	this.sameTitleClicked = false;
	if(this.clickedElm.parentNode.parentNode.className.indexOf('act') != -1) {
		this.sameTitleClicked = true;
	}
	this._hideDesc();

	if(!this.sameTitleClicked) {
		var tr = this.clickedElm.parentNode.parentNode;
		tr.className = 'act';

		var td = tr.childNodes[1];

		var table = this.parent.tvTable;

		var nTr = table.insertRow(tr.rowIndex+1);
		nTr.className = 'act';

		var fakeTd = nTr.insertCell(0);
		fakeTd.className = 'fakeTD';

		var nTd = nTr.insertCell(1);

		nTd.className = "desc"
		nTd.innerHTML = this.data.description;

		var a = JAK.cel('a');
		a.className = "close";
		a.href = "";
		a.innerHTML = "Skrýt detail";
		nTd.appendChild(a);
		this.eventsCache['tvlinksClose'] = JAK.Events.addListener(a, 'click', this, '_hideDesc', false, true);
	}
};

JAK.TvProgram.Slot.prototype._hideDesc = function (e, elm) {
	if(typeof e != "undefined") {
		JAK.Events.cancelDef(e)
	}

	var table = this.parent.tvTable;
	var actTr = JAK.DOM.getElementsByClass('act', table, 'TR');

	for(var i = 0; i < actTr.length; i++) {
		actTr[i].className = '';
		if(actTr[i].firstChild.className == 'fakeTD') {
			JAK.Events.removeListener(this.eventsCache['tvlinksClose']);
			actTr[i].parentNode.removeChild(actTr[i]);
		}
	}
}

JAK.TvProgram.Slot.prototype._close = function (e, elm) {
	this.parent.settings.closeSettings(e,elm);
};

JAK.TvProgram.Slot.prototype._process = function (response) {
	var data = eval("("+response+")");
	if (data.status == 500) {
	} else if (data.status == 200) {
		this.data = data;
		this.parent.data = data;
		if(data.method == 'getChannels') {
			this.change();
		} else if ( data.method == 'getDescription') {
			this._showDesc();
		}
	} else if(data.status == 401) {
		alert('Něco je špatně!');
	}
};
