/* Lide */
JAK.Lide = JAK.ClassMaker.makeClass({
	NAME:"Lide",
	VERSION:"1.0"
});

JAK.Lide.prototype.$constructor = function (parent,feedId) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}

	this.feedId = feedId;
	this.parent = parent;
	this.htmlObject = JAK.gel(parent);
	this.eventsCache = new Object();

	this.answer = null;
	this.friends = JAK.gel('friends');
	this._getData();
};

JAK.Lide.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Lide.prototype._getData = function () {
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"get"});
	rq.setCallback(this, '_process');
	rq.send(Homepage.CONF.FRIENDS_URL+Homepage.FRIENDSHASH);
};

JAK.Lide.prototype._process = function (response) {
	var data = response;
	if(data.indexOf("'status : 'no''") == -1) {
		try {
			this.answer = eval(data.replace("var answer = {friends :","").replace("};exeResponse(answer,'friends');",""));
		} catch(e) {
			this.answer = null;
		}
	} else {
		this.answer = null;
	}

	if(this.answer != null) {
		this._build();
	}
};

JAK.Lide.prototype._build = function () {
	var html = '<ul>';

	for(var i=0; i<this.answer.length; i++) {
		var icon = this.answer[i].sex == 'M'?'ico-M':'ico-W';
		html +=
			'<li class="' + icon + '"><a href="http://www.lide.' + _tld + '/' + this.answer[i].nick + '">' + this.answer[i].nick + '</a> </li>';
	}
	html += '<li class="next"><a href="http://profil.lide.' + _tld + '">Další ...</a></li>';
	html += '</ul>';

	this.friends.innerHTML = html;
};
