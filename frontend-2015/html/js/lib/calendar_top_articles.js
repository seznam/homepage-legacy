/**
 * @class Kalendar, zpravidla neni treba rucne instantializovat
 * @group jak-widgets
 * @signal datepick
 * @signal calendarShow
 * @signal calendarHide
 **/
JAK.CalendarTopArticles = JAK.ClassMaker.makeClass({
	NAME: "JAK.CalendarTopArticles",
	VERSION: "1.0",
	EXTEND: JAK.Calendar
});

JAK.CalendarTopArticles.prototype.$constructor = function(optObj) {
	this.$super(optObj);

	this.addListener("calendarHide", this._hideOpenedMark.bind(this));
	this.addListener("calendarShow", this._showOpenedMark.bind(this));
}

JAK.CalendarTopArticles.manage = function(calendar, clickElm, actualDate, todayDate, firstDate) { /* setup calendar for two elements */
	calendar.opener = clickElm;

	var callback = function() {
		var dateParts = arguments[0].split('.');
		var day = parseFloat(dateParts[0]) >= 10 ? dateParts[0] : "0" + dateParts[0];
		var month = parseFloat(dateParts[1]) >= 10 ? dateParts[1] : "0" + dateParts[1];
		var year = dateParts[2];
		var date = parseFloat(year+""+month+""+day);

		var locationDate = year+"-"+month+"-"+day;

		if (date < todayDate && date >= firstDate) {
			window.location = "//www.seznam."+_tld+"/nejctenejsi-clanky?date="+locationDate;
		} else {
			// - console.log('budoucnost');
		}
	}

	var click = function(e,elm) {
		if (!calendar._visible) {
			var pos = JAK.DOM.getBoxPosition(clickElm);
			var x = pos.left;
			var y = pos.top + clickElm.offsetHeight + 1;

			calendar.pick(x,y,actualDate,callback);
		} else {
			calendar._hide();
		}
	}

	var clearClick = function(e,elm) {
		if (e) {
			JAK.Events.stopEvent(e);
			JAK.Events.cancelDef(e);
		}
	}

	calendar.ec.push(JAK.Events.addListener(clickElm,"click",window,click));
	calendar.ec.push(JAK.Events.addListener(clickElm,"mousedown",window,clearClick));
}

JAK.CalendarTopArticles.prototype._showOpenedMark = function(signal) {
	var opener = this.opener;
	if (opener) {
		JAK.DOM.addClass(opener, "opened");
	}
}

JAK.CalendarTopArticles.prototype._hideOpenedMark = function(signal) {
	var opener = this.opener;
	if (opener) {
		JAK.DOM.removeClass(opener, "opened");
	}
}

/**
 * vytvareni odkazoveho buttonku
 */				 				
JAK.CalendarTopArticles.createButton = function(label, openerId) {
	var click = JAK.gel(openerId);
		click.title = label;

	return click;
}

JAK.CalendarTopArticles.setup = function(label, openerId, actualDate, todayDate, firstDate) {
	var cal = new JAK.CalendarTopArticles({});
		cal.todayDate = parseFloat(todayDate);
		cal.firstDate = parseFloat(firstDate);
	var click = JAK.CalendarTopArticles.createButton(label, openerId);
	JAK.CalendarTopArticles.manage(cal, click, actualDate, todayDate, firstDate);
}

JAK.CalendarTopArticles.prototype._buildDom = function() { /* create dom elements, link them together */
	this._dom.container = JAK.mel("div", null, {position:"absolute"});
	this._dom.content = JAK.cel("div", "cal-content");
	this._dom.thead = JAK.cel("table");
	this._dom.headBox = JAK.cel("div", "thead");
	this._dom.headBox.appendChild(this._dom.thead);
	this._dom.tbody = JAK.cel("table");
	this._dom.bodyBox = JAK.cel("div", "tbody");
	this._dom.bodyBox.appendChild(this._dom.tbody);
	this._dom.tfoot = JAK.cel("table", "tfoot");
	this._dom.thead.cellSpacing = 0;
	this._dom.thead.cellPadding = 0;
	this._dom.tbody.cellSpacing = 0;
	this._dom.tbody.cellPadding = 0;
	
	if (JAK.Browser.client == "ie") {
		this._dom.iframe = JAK.mel("iframe", null, {position:"absolute",left:"0px",top:"0px",zIndex:1});
		this._dom.content.style.zIndex = 2;
		JAK.DOM.append([this._dom.container,this._dom.iframe,this._dom.content],[this._dom.content]);
	} else {
		JAK.DOM.append([this._dom.container,this._dom.content],[this._dom.content]);
	} 
	JAK.DOM.append([this._dom.content,this._dom.headBox,this._dom.bodyBox,this._dom.tfoot]);
	
	/* top part */
	var r2 = JAK.cel("tr");
	var r3 = JAK.cel("tr");
	JAK.DOM.append([this._dom.thead,r2]);
	JAK.DOM.append([this._dom.tbody,r3]);

	this._dom.move = JAK.cel("td", "cal-title");
	this._dom.move.colSpan = 5;
	
	var x = " (podrž pro menu)";
	var buttonLabels = ["◄","►"];
	var buttonStatuses = ["Předchozí měsíc"+x,"Následující měsíc"+x];
	var buttonMethods = [this._monthB,this._monthF];
	this._dom.buttons = [];
	for (var i=0;i<buttonLabels.length;i++) {
		var button = new JAK.Calendar.Nav(this,buttonLabels[i],buttonStatuses[i],buttonMethods[i]);
		JAK.DOM.addClass(button.td,"cal-button cal-nav");
		this._dom.buttons.push(button.td);
		r2.appendChild(button.td);
		if (i==0) {
			r2.appendChild(this._dom.move);
		}
	}
	
	var wk = JAK.cel("td", "cal-dayname cal-wn");
	wk.innerHTML = "wk";
	r3.appendChild(wk);
	
	for (var i=0;i<this.options.dayNames.length;i++) {
		var day = JAK.cel("td", "cal-dayname");
		day.innerHTML = this.options.dayNames[i];
		r3.appendChild(day);
		if (i > 4) { JAK.DOM.addClass(day,"cal-weekend"); }
	}
	
	/* middle part */
	this._dom.rows = [];
	for (var i=0;i<42;i++) { /* magic number of days. */
		var day = new JAK.CalendarTopArticles.Day(this, this.todayDate, this.firstDate);
		this._days.push(day);
		if (!(i % 7)) {
			var tr = JAK.cel("tr");
			this._dom.rows.push(tr);
			this._dom.tbody.appendChild(tr);
			this.ec.push(JAK.Events.addListener(tr,"mouseover",this,"_overRef"));
			this.ec.push(JAK.Events.addListener(tr,"mouseout",this,"_outRef"));
			var wk = JAK.cel("td", "cal-wn cal-day");
			tr.appendChild(wk);
		}
		JAK.DOM.addClass(day.td,"cal-day");
		tr.appendChild(day.td);
		if (i % 7 > 4) { JAK.DOM.addClass(day.td,"cal-weekend"); }
	}
	
	/* bottom part */
	var tr = JAK.cel("tr");
	this._dom.status = JAK.cel("td", "cal-status");
	this._dom.status.colSpan = this.options.pickTime ? 5 : 7;
	JAK.DOM.append([this._dom.tfoot,tr],[tr,this._dom.status]);
	this._dom.status.innerHTML = "Vyberte datum";
	//generovani casovych inputu
	if (this.options.pickTime) {
		var td = JAK.cel("td", "cal-time");
		td.colSpan = 2;
		
		var inputHour = JAK.cel('input');
		inputHour.type = 'text';
		this._dom.hour = inputHour;
		
		var sep = JAK.ctext(':');
		
		var inputMinute = JAK.cel('input');
		inputMinute.type = 'text';
		this._dom.minute = inputMinute;
		
		JAK.DOM.append([td, inputHour], [td, sep], [td, inputMinute],[tr,td]);
		
		this.ec.push(JAK.Events.addListener(this._dom.hour,"keydown", this,"_keyDown"));
		this.ec.push(JAK.Events.addListener(this._dom.minute,"keydown", this,"_keyDown"));
	}
	
	
	/* rollers */
	for (var i=0;i<this._dom.buttons.length;i++) {
		if (i == 2) { continue; }
		var type = (i == 1 || i == 3 ? 0 : (i < 2 ? -1 : 1));
		var roller = new JAK.Calendar.Roller(this,this._dom.buttons[i],type,i > 2);
		this._rollers.push(roller);
	}
	
	/* misc */
	/*-this.ec.push(JAK.Events.addListener(this._dom.move,"mousedown",this,"_dragDown"));-*/
	this.ec.push(JAK.Events.addListener(this._dom.container,"mousedown",this,"_cancelDown"));
}

/* ---------------------- Calendar.Day, jedna denni bunka v kalendari ---------------------- */
/**
 * @class
 * @private
 * @augments JAK.Calendar.Button
 */
JAK.CalendarTopArticles.Day = JAK.ClassMaker.makeClass({
	NAME: "JAK.CalendarTopArticles.Day",
	VERSION: "1.0",
	EXTEND: JAK.Calendar.Day
});

JAK.CalendarTopArticles.Day.prototype.$constructor = function(calendar, todayDate, firstDate) {
	this.td = JAK.cel("td", "cal-day");
	this.text = JAK.cel("div", "cal-text");
	this.td.appendChild(this.text);
	this.calendar = calendar;
	this.date = false;

	this.calendar.ec.push(JAK.Events.addListener(this.td, "mouseup", this, "_up"));
	this.addOverEvents(this.td);
	this.addDownEvents(this.td);

	this.todayDate = todayDate;
	this.firstDate = firstDate;
/*-
	var today = new Date();
	this.todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
-*/
}

JAK.CalendarTopArticles.Day.prototype.redraw = function(today) {
	this.text.innerHTML = this.date.getDate();
	var year = parseFloat(this.date.getFullYear());
	var month = this.date.getMonth()+1;
		month = month >= 10 ? month : "0"+month;
	var day = this.date.getDate();
		day = day >= 10 ? day : "0"+day;
	var date = year+""+month+""+day;

	JAK.DOM.removeClass(this.td,"cal-today");
	JAK.DOM.removeClass(this.td,"cal-past");
	JAK.DOM.removeClass(this.td,"cal-future");
	JAK.DOM.removeClass(this.td,"cal-selected");
	JAK.DOM.removeClass(this.td,"cal-obsolete");
	if (this.calendar.equalDates(this.date,today)) { JAK.DOM.addClass(this.td,"cal-today"); }
	if (date < this.firstDate) { JAK.DOM.addClass(this.td,"cal-past"); }
	if (date >= this.todayDate) { JAK.DOM.addClass(this.td,"cal-future"); }
	if (this.calendar.equalDates(this.date,this.calendar.selectedDate)) { JAK.DOM.addClass(this.td,"cal-selected"); }
	if (this.date.getMonth() != this.calendar.currentDate.getMonth()) { JAK.DOM.addClass(this.td,"cal-obsolete"); } 
}
