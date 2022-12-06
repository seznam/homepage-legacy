/* TV prepinani - rozsireni gadgetu */
JAK.TvProgram = JAK.ClassMaker.makeClass({
	NAME:"TvProgram",
	VERSION:"1.0"
});
JAK.TvProgram.prototype.$constructor = function (feedId,parent,type,tipAvail) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}
	this.eventsCache = new Object();
	this.feedId = feedId;
	this.parent = parent;
	this.type = type;
	this.tipAvail = tipAvail;

	this.tvcont = JAK.gel('tv-cont');
	this.tvTable = JAK.gel('tv-cont').getElementsByTagName('TABLE')[0];
	//if (type == 'tips') {
	//} else {
		this._initAct(type);
		this._initTips(type);
	//}
};

JAK.TvProgram.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.TvProgram.prototype._rowHeight = function () {
	// pomocny vypocet vysky boxu
	var clone = this.perexes[0].cloneNode(true);
	var clonetext = clone.innerHTML.substring(0,10);
	clone.innerHTML= clonetext;
	clone.style.visibility = 'hidden';
	this.perexes[0].parentNode.appendChild(clone);
	var h = parseInt(clone.offsetHeight);
	this.perexes[0].parentNode.removeChild(clone);
	return h;
}

JAK.TvProgram.prototype._initTips = function (type) {
	this.titles = JAK.DOM.getElementsByClass('titl', this.tvTable, 'a');
	this.perexes = JAK.DOM.getElementsByClass('perex', this.tvTable, 'span');

	if (this.tipAvail != 0) {
		this.times = JAK.gel('times');
		var pipe =  JAK.cel('span');
		pipe.innerHTML = ' | ';
		this.times.appendChild(pipe);

		var a = JAK.cel('a');
		a.className = 'tips';
		a.id = 'tips';
		a.href = '#';
		a.innerHTML = 'TV tip';
		this.times.appendChild(a);
		this.title = a;
		this.eventsCache.title = JAK.Events.addListener(a, 'click', this, '_send', false, true);
	}

	if (type == 'tips') {
		this.act = this.active = this;
		this.title.className = 'act';
	}


	if (type == 'tips') {
		this.rHeight = this._rowHeight();

		for (var i = 0; i < this.titles.length; i++) {
			if (i == 0) {
				var img = JAK.DOM.getElementsByClass('top-foto', this.tvTable, 'img')[0];
				JAK.Events.addListener(img, 'click', this, this._showDesc);
				img.__perex = this.perexes[i];
			}
			JAK.Events.addListener(this.titles[i], 'click', this, this._showDesc);
			this.perexes[i].style.overflow = 'hidden';
			if (i == 0) {
				this.perexes[i].style.height =  this.rHeight + 'px';
			} else {
				this.perexes[i].style.height =  0 + 'px';
			}
			this.titles[i].__perex = this.perexes[i];
			this.titles[i].__index = i;
		}
	}
};

JAK.TvProgram.prototype._send = function (e, elm) {
	JAK.Events.cancelDef(e);
	if (elm.className == 'act') {
		return
	}
	this.type = 'tips';
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsTvGetChannels', 'hashId=' + Homepage.CONF.HASHID + '&type=tips');
};

JAK.TvProgram.prototype._process = function (response) {
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

JAK.TvProgram.prototype._showDesc = function (e, elm) {
	JAK.Events.cancelDef(e);
	if (elm.__perex.style.overflow == 'hidden') {
		elm.__perex.style.overflow = 'visible';
		elm.__perex.style.height =  'auto';
	} else {
		elm.__perex.style.overflow = 'hidden';
		if (elm.__index == 0) {
			elm.__perex.style.height =  this.rHeight + 'px';
		} else {
			elm.__perex.style.height =  0 + 'px';
		}
	}
}

JAK.TvProgram.prototype.change = function () {
	// kdyz se zmeni typ zobraznovaneho programu, tak neaktualizuji a pockam
	//az na reload

	if (this.data.type != this.type) {
		return;
	}

	if (this.type == 'tips') {
		this._update();
	} else {
		this.act.change();
	}
};

JAK.TvProgram.prototype._update = function () {
	var d = this.data.items;
	var t = this.tvTable;
	var tr = t.getElementsByTagName('tr');

	while(t.rows.length > 0) {
		t.deleteRow(t.rows.length-1);
	}
	/* pro jistotu smazem i to co tam zustane */
	while(t.childNodes.length > 0) {
		t.removeChild(t.childNodes[0]);
	}

	for (var i = 0; i < d.length; i++) {
		var trChnl = t.insertRow(t.rows.length);
		var tdChnl = trChnl.insertCell(0);

		if (i == 0) {
			tdChnl.innerHTML = '<td class="top">'+
						'<div class="hlp">'+
							'<img  class="top-foto" src="'+d[i].picture_url+'" width="50" height="40" alt="" /> '+
							'<div class="text-box"> '+
							'<strong><a class="titl" data-dot="title" href="#">'+d[i].title+'</a></strong> '+
							'<span class="date">'+d[i].time_start+'</span> '+
							'<span class="channel">'+d[i].channel_name+'</span> '+
							'<span class="perex">'+d[i].description+'</span> '+
							'</div>'+
						'</div>'+
					'</td>';
		} else {
			tdChnl.innerHTML = '<div class="hlp"><a class="titl" href="#">'+d[i].title+'</a> <span class="date">'+d[i].time_start+'</span> <span class="channel">'+d[i].channel_name+'</span> <span class="perex">'+d[i].description+'</span></div>';
		}
	}

	this.titles = JAK.DOM.getElementsByClass('titl', t, 'a');
	this.perexes = JAK.DOM.getElementsByClass('perex', t, 'span');
	this.rHeight = this._rowHeight();
	for (var i = 0; i < this.titles.length; i++) {
		if (i == 0) {
			var img = JAK.DOM.getElementsByClass('top-foto', t, 'img')[0];
			JAK.Events.addListener(img, 'click', this, this._showDesc);
			img.__perex = this.perexes[i];
		}

		JAK.Events.addListener(this.titles[i], 'click', this, this._showDesc);

		this.perexes[i].style.overflow = 'hidden';
		if (i == 0) {
			this.perexes[i].style.height =  this.rHeight + 'px';
		} else {
			this.perexes[i].style.height =  0 + 'px';
		}
		this.titles[i].__perex = this.perexes[i];
		this.titles[i].__index = i;
	}

	this.active.title.className = '';
	this.active = this.parent.act = this;
	this.title.className = 'act';
}

JAK.TvProgram.prototype._initAct = function (type) {
	this.times = JAK.gel('times');

	this.timesIds = ['now','1600_1800','1800_2000','2000_2200','2200_2400'];
	this.timesArray = new Array();
	for(var i = 0; i < this.timesIds.length; i++) {
		 this.timesArray.push(new JAK.TvProgram.Slot(this.timesIds[i],this));
		 if(i == 0 && type == 'now') {
			 this.act = this.active = this.timesArray[this.timesArray.length-1];
		 }
	}

	// je potreba kvuli aktualizaci
	//this.act = new JAK.TvProgram.Slot(this);
};
