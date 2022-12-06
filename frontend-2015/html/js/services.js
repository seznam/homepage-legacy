/* katalog */
JAK.Services = JAK.ClassMaker.makeClass({
	NAME:"Services",
	VERSION:"1.0"
});

JAK.Services.prototype.$constructor = function (parent,feedId, cols, gadgetNotice) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}

	this.cols = cols;
	this.notice = gadgetNotice;

	this.feedId = feedId;
	this.parent = parent;
	this.htmlObject = JAK.gel(parent);
	this.titleDay = JAK.DOM.getElementsByClass('d', this.htmlObject, 'span')[0];
	this.services = JAK.DOM.getElementsByClass('services', this.htmlObject, 'div');
	this.days = JAK.DOM.getElementsByClass('day', this.htmlObject, 'div');
	this.gCnt = JAK.DOM.getElementsByClass('g-cnt', this.htmlObject, 'div')[0];
	this.weatherMoreLink = JAK.DOM.getElementsByClass('more', this.htmlObject, 'p')[0];

	// prevedeni definice velikosti pisma na px - kvuli zoomovani v iPhonu s iOS 5.x
	var modelFont = JAK.gel('se1').getElementsByTagName('a')[0];
	var fontSizeInPixels = JAK.DOM.getStyle(modelFont, 'fontSize');
	if (fontSizeInPixels.indexOf('px') > -1) {
		this.htmlObject.style.fontSize = fontSizeInPixels;
	}

	this.dayName = JAK.DOM.getElementsByClass('day-name', this.htmlObject, 'strong')[0];
	this.firstDay = this.days[0];
	this.district = JAK.DOM.getElementsByClass('district', this.htmlObject, 'strong')[0];

	this.eventsCache = new Object();

	this.cont = JAK.DOM.getElementsByClass('main-cont', this.htmlObject, 'DIV')[0];

	this.eventsCache.resizator = JAK.Events.addListener(window, 'resize', this, '_update', false, true);

	this._daysShort = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
	this._days = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
	this._districtsShort = ['Jablonec nad N.', 'Rychnov nad K.'];
	this._districts = ['Jablonec nad Nisou', 'Rychnov nad Kněžnou'];

	this._update();
};

JAK.Services.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Services.prototype._update = function () {
	//pocitani odsazeni districtu
	var dif = Math.round((this.firstDay.offsetWidth - this.dayName.offsetWidth)/2)-1;
	if (dif > 0) {
		this.district.style.paddingLeft = (dif + "px");
	}

	var w = this.htmlObject.offsetWidth;

	var wp = JAK.DOM.getDocSize().width;
	var d = this.titleDay.innerHTML.replace(',', '');	// - v případě, že je uveden dlouhý název dne s čárkou na konci, tak ji odstraním, abych ji dohledal v seznamu názvu dní;

	var id = this._daysShort.indexOf(d);

	if (id != -1) {
		id = this._days[id];
		idS = d;
	} else {
		id = this._days.indexOf(d);
		idS = this._daysShort[id];
		id = d+',';	// - přidám čárku za dlouhý název dne;
	}

	var district = this.district.innerHTML;
	var dIndex = this._districtsShort.indexOf(district);
	if (dIndex === -1) {
		dIndex = this._districts.indexOf(district);
	}

	var weatherBox = JAK.gel('g-weather');

	if(this.cols < 3){		
		if(w <= 481 && w > 387){
			this._showShort(idS, dIndex);
			weatherBox.style.paddingTop = 0+'px';
		} else if (w <= 387){
			this._showLong(id, dIndex);
			weatherBox.style.paddingTop = 10+'px';
		}else{
			this._showLong(id, dIndex);
			weatherBox.style.paddingTop = 0+'px';
		}
		
	}else{
			this._showLong(id, dIndex);
			weatherBox.style.paddingTop = 0+'px';
		}
		
	this._weatherCenter();
}

JAK.Services.prototype._weatherCenter = function (){
	var weatherBox = JAK.gel('g-weather');
	
	var bw = this.htmlObject.offsetWidth;
	var gw = weatherBox.offsetWidth;
	var sw = JAK.DOM.getElementsByClass('servicesWrapper', this.htmlObject, 'div')[0].offsetWidth;
	
	var c = bw - (gw + sw);
	if(c < 0){c = 0;}
	
	weatherBox.style.marginLeft = Math.floor(c/2) +"px";

}

/* zobrazi treti predpoved */
JAK.Services.prototype._showLong = function (id, dIndex) {
	this.titleDay.innerHTML = id;

	for (var i = 0; i < this.days.length; i++) {
		//JAK.DOM.removeClass(this.days[i], 'wideday');
		//JAK.DOM.removeClass(this.services[i], 'widecol');
	}
	this.days[this.days.length-1].style.display = "block";
	JAK.DOM.removeClass(this.days[this.days.length-2], "preLast");

	if (dIndex > -1) {
		if(this.cols < 3){
			this.district.innerHTML = this._districts[dIndex];
		}else{
			this.district.innerHTML = this._districtsShort[dIndex];
		}
	}
	if (this.weatherMoreLink) {
		//this.weatherMoreLink.style.display = "block";
		if(this.cols < 3){
			this.weatherMoreLink.children[0].innerHTML = 'Dlouhodobá předpověď &raquo;';
		}else{
			this.weatherMoreLink.children[0].innerHTML = 'Další dny &raquo;';
		}
	}
	JAK.DOM.removeClass(this.htmlObject, "smallBox");
};

/* zobrazi pouze dve predpovedi */
JAK.Services.prototype._showShort = function (id, dIndex) {
	this.titleDay.innerHTML = id;
	for (var i = 0; i < this.days.length; i++) {
		//JAK.DOM.addClass(this.days[i], 'wideday');
		//JAK.DOM.addClass(this.services[i], 'widecol');
	}
	this.days[this.days.length-1].style.display = "none";
	
	JAK.DOM.addClass(this.days[this.days.length-2], "preLast");

	if (dIndex > -1) {
		this.district.innerHTML = this._districtsShort[dIndex];
	}
	if (this.weatherMoreLink) {
		//this.weatherMoreLink.style.display = "none";
		this.weatherMoreLink.children[0].innerHTML = 'Další dny &raquo;';
	}

	this.district.style.paddingLeft = 0;

	JAK.DOM.addClass(this.htmlObject, "smallBox");
};

JAK.Services.prototype._moveUpdate = function () {
	this._update();
	this.notice.updateShow();
};

/* vola class Win pri pohzbu */
JAK.Services.prototype.onMoveAction = function () {
	if(this.time){clearTimeout(this.t)}
	this.time = setTimeout(this._moveUpdate.bind(this),100);
};
