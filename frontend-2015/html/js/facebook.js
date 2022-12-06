JAK.FB = JAK.ClassMaker.makeClass({
		NAME: 'JAK.FB',
		VERSION: '2.0'
})

JAK.FB.prototype.$constructor = function (feedId, parent, access_token, fbPictureShow, fbItemsCount, uid) {

	//this.api = '187247214633334';
	this.appId = Homepage.CONF.FBAPIKEY;
	this.access_token = access_token;
	this.feedId = feedId;
	this.parent = parent;

	this._ec = [];
	this._dom = {
		logout: JAK.gel("fb-logout"), /* odkaz na logout */
		settings: JAK.gel("fb-settings"), /* odkaz na nastaveni */
		logUser: JAK.gel('log-user'),
		container: JAK.gel("fb-container"),
		login: false,
		info: false,
		form: false,
		list: false,

		//list
		bottom: JAK.cel("div", null, "fb-bottom"),
		prev: JAK.cel("a", null, "fb-prev"),
		next: JAK.cel("a", null, "fb-next"),
		clear: JAK.cel("div", "clear"),
		loader: JAK.mel("div", {id:"loader"}, {'display': 'none', 'position': 'static', 'margin': '2em auto'})
	};

	// stranovani pocet
	this.itemsCount = fbItemsCount;
	this.fbPictureShow = fbPictureShow;
	this.page = 0;

	this._dom.prev.innerHTML = "&laquo; Novější";
	this._dom.prev.href = "#";
	this._dom.next.innerHTML = "Starší &raquo;";
	this._dom.next.href = "#";
	this._dom.loader.innerHTML = "Čekejte prosím";

	JAK.DOM.append([this._dom.bottom, this._dom.prev, this._dom.next, this._dom.clear]);

	this._ec.push(JAK.Events.addListener(this._dom.prev, "click", this, "_prev"));
	this._ec.push(JAK.Events.addListener(this._dom.next, "click", this, "_next"));
	this._ec.push(JAK.Events.addListener(this._dom.logout, 'click', this, this._logout));

	// prilinkuj fb knihovnu
	(function() {
		var e = document.createElement('script'); e.async = true;
		e.src = document.location.protocol +
			'//connect.facebook.net/cs_CZ/all.js';
		document.getElementById('fb-root').appendChild(e);
	}());

	// prilinkovana knihovna zavola tuto metodu
	var fbAsyncInit = function () {

		var conf = {
			appId: this.appId,
			status: false,
			cookie: true,
			xfbml: true
		}
		if (this.access_token != '') {
			conf.session = JSON.parse(this.access_token);
		}

		FB.init(conf);

		// zjisitim stav jestli je uzivatel prihlaseny - nejdrive u nas v DB
		if (this.access_token != '') {
			//FB._session = JSON.parse(this.access_token);
			this._build();
		} else {
			this._buildLogin();
			this._showLogin();
		}
	}
	window.fbAsyncInit = fbAsyncInit.bind(this);
}

/* kliknuti na odhlaseni */
JAK.FB.prototype._logout = function (e, eml) {
	JAK.Events.cancelDef(e);
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_processLogout');
	rq.send('/jsSetupFacebookProcess', 'hashId=' + Homepage.CONF.HASHID + '&feedId=' + this.feedId + '&sessionId=&uid=');
};

JAK.FB.prototype._processLogout = function (response) {
	var data = eval("("+response+")");
	if (data.status == 200) {
		/* nic nevykonavam */
		FB._session = null;
		this.parent.settings.closeSettings();
		this._showLogin();
	} else {
		alert('Něco je špatně!');
	}
};

JAK.FB.prototype._getLoginStatus = function () {
	var _getLoginStatus = function(response) {
			this._build();
	}
	_getLoginStatus = _getLoginStatus.bind(this);
	FB.getLoginStatus(_getLoginStatus);
}

/*JAK.FB.prototype._processLogout = function () {
	return 0;
}*/

JAK.FB.prototype._login = function () {
	var _login = function(response) {
		if (response.session) {
			if (response.perms) {
				this.access_token = JSON.stringify(response.session);
				var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
				rq.setCallback(this, '_process');
				rq.send('/jsSetupFacebookProcess', 'hashId=' + Homepage.CONF.HASHID + '&feedId=' + this.feedId + '&sessionId=' + this.access_token + '&uid=xxx');
				this._build();
			} else {
				// uzivatel nema prava
			}
		} else {
			// uplne se to pokazilo
		}
	};
	_login = _login.bind(this);

	FB.login(_login, {perms:'read_stream,publish_stream,offline_access,read_mailbox,friends_status'});
}

JAK.FB.prototype._process = function(response) {
	var data = eval("("+response+")");
	if (data.status == 200) {
		/* nic nevykonavam */
	} else {
		alert('Něco je špatně!');
	}
}

JAK.FB.prototype._buildLogin = function () {
	var login = JAK.cel("a", null, "fb-login");
	login.appendChild(JAK.ctext("Tento modul lze používat až po přihlášení k serveru"));

	var box = JAK.cel("span", null, "fb-box");
	box.innerHTML = '<img src="'+ Homepage.CONF.PATH_IMG + '/fb-login.gif" width="109" height="24" alt="" /> - klikněte zde pro přihlášení ke službě FaceBook</div>';
	login.appendChild(box);

	this._ec.loginClick = JAK.Events.addListener(box, 'click', this, this._login);
	this._dom.login = login;
}

JAK.FB.prototype._showLogin = function() {
	JAK.DOM.clear(this._dom.container);
	if (!this._dom.login) {
		this._buildLogin();
	}

	this._dom.container.appendChild(this._dom.login);
}

JAK.FB.prototype._build = function () {
	this._dom.info = JAK.cel("div", null, "fb-info");
	this._dom.form = JAK.cel("div", null, "fb-form");
	this._dom.list = JAK.cel("div", null, "fb-list");

	if (this._ec.loginClick) {
		JAK.Events.removeListener(this._ec.loginClick);
	}

	JAK.DOM.clear(this._dom.container);
	JAK.DOM.append([this._dom.container, this._dom.info, this._dom.form, this._dom.list]);

	// vyrob pridavaci form
	this._bForm();

	// vyrob prouzek s infem
	this._binfo();

	this._blist();
}

/*
 * vyrobi status input a cudlik odeslat
 */
JAK.FB.prototype._bForm = function () {
	var form = JAK.cel('form');
	form.innerHTML = '<label for="fb-input" class="blind">Váš současný status</label>';
	JAK.DOM.clear(this._dom.form);
	this._dom.form.appendChild(form);

	var input = JAK.cel("input", null, "fb-input");
	input.type = "text";

	var submit = JAK.cel("input");
	submit.type = "submit";
	submit.value = "Odeslat";

	var bottom = JAK.cel("div", null, "fb-my-status");
	var text = JAK.cel("span", null, "fb-status");
	var date = JAK.cel("span", null, "fb-date");

	JAK.DOM.append([bottom, text, date], [form, input, submit, bottom]);
	this._ec.push(JAK.Events.addListener(form, 'submit', this, this._setStatus));

	this._dom.input = input;
	this._dom.status = text;
	this._dom.date = date;

	this._getUserInfo();
}

/**
 * @param date - timestamp in miliseconds
 */
JAK.FB.prototype._niceDate = function(date) {
	var now = new Date().getTime();
	var diff = (now - date) / 1000;

	var hourLimit = 5.5;
	var minute = 60;
	var hour = 60 * minute;
	var day = 24 * hour;

	if (diff < 60) {
		return "před chvílí";
	} else if (diff < hour) {
		var m = Math.round(diff / minute);
		return "před " +  (m == 1 ? "minutou" : m + " minutami");
	} else if (diff < hour * hourLimit) {
		var h = Math.round(diff / hour);
		return "před " +  (h == 1 ? "hodinou" : h + " hodinami");
	} else if (diff < 7 * day) {
		return this._dayName(date) + " " + this._dayPart(date);
	} else {
		return new Date(date).format("j.n.Y");
	}
};

JAK.FB.prototype._dayPart = function(ts) {
	var d = new Date(ts);
	var h = d.getHours();
	if (h >= 6 && h <= 8) {
		return "ráno";
	} else if (h > 8 && h <= 12) {
		return "dopoledne";
	} else if (h > 12 && h <= 18) {
		return "odpoledne";
	} else if (h > 18 && h <= 22) {
		return "večer";
	} else {
		return "v noci";
	}
}

JAK.FB.prototype._dayName = function(ts) {
	var mid = new Date();
	mid.setHours(0);
	mid.setMinutes(0);
	mid.setSeconds(0);
	mid.setMilliseconds(0);

	var day = 60 * 60 * 24;

	var diff = Math.round((mid.getTime() - ts) / 1000);
	if (diff < 0) {
		return "dnes";
	} else if (diff < day) {
		return "včera";
	} else if (diff < 2*day) {
		return "předevčírem";
	} else {
		return ["v neděli", "v pondělí", "v úterý", "ve středu", "ve čtvrtek", "v pátek", "v sobotu"][mid.getDay()];
	}
}

/*
 * informace o me bez statusu
*/
JAK.FB.prototype._getUserInfo = function (e, elm) {
	var _me = function(response) {
		this.me  = response;
		this._writeUserInfo();
	}
	_me = _me.bind(this);
	FB.api('/me', _me);

	// ziskej muj status
	var _status = function(response) {

		var _row = function(row) {
			this._dom.status.innerHTML = this.me.first_name + ' ' + row[0].message;
			this._dom.date.innerHTML = " - " + this._niceDate(row[0].time * 1000);
			this._dom.input.value = '';
		}
		var query = FB.Data.query('select status_id,time,message from status where uid={0} limit 1', FB.getSession().uid);
		query.wait(_row.bind(this));
	}

	FB.api('/me', _status.bind(this));
}

/*
 * vypise moje jmeno do titulku
 */
JAK.FB.prototype._writeUserInfo = function () {
	var me = this.me;
	var name = me.first_name;
	this._dom.logUser.innerHTML = name;
}

/* updatne muj status */
JAK.FB.prototype._setStatus = function (e, elm) {
	JAK.Events.cancelDef(e);
	var body = this._dom.input.value;

	var _graphStreamPublish = function(response) {
		if (!response || response.error) {
			alert('Error occured');
		} else {
			this._updateMessage();
		}
	}

	_graphStreamPublish = _graphStreamPublish.bind(this);

	FB.api('/me/feed', 'post', { message: body }, _graphStreamPublish);
}

JAK.FB.prototype._updateMessage = function () {
	var txt = JAK.ctext(this.me.first_name + ' ' + this._dom.input.value);
	this._dom.status.innerHTML = '';
	this._dom.status.appendChild(txt);
}

/* vyrobi informacni prouzek a slouzi i k aktualizaci*/
JAK.FB.prototype._binfo = function () {
	var _infos = function(response) {
		this.infos = response;
		this._bI();
	}

	FB.api({method: 'notifications.get', urls: Homepage.CONF.FBURLS}, _infos.bind(this));
};

JAK.FB.prototype._bI = function() {
	var inf = this.infos;
	if (inf.messages) {
		var space = "&nbsp;";
		var html =	'<ul>'+
						'<li id="fb-i-new"><a target="_blank" href="http://www.facebook.com/inbox/">' + inf.messages.unread + space + ({1:"zpráva",2:"zprávy",3:"zprávy",4:"zprávy"}[inf.messages.unread] || "zpráv") + '</a></li> '+
						'<li id="fb-i-auth"><a target="_blank" href="http://www.facebook.com/reqs.php#friend">' + inf.friend_requests.length + space + ({1:"autorizace",2:"autorizace",3:"autorizace",4:"autorizace"}[inf.friend_requests.length] || "autorizací") + '</a></li> '+
						'<li id="fb-i-jog"><a target="_blank" href="http://www.facebook.com/home.php">' + inf.pokes.unread + space + 'šťouchnutí</a></li> '+
						'<li id="fb-i-evnt"><a target="_blank" href="http://www.facebook.com/reqs.php#event_confirm">' + inf.event_invites.length +  space + ({1:"událost",2:"události",3:"události",4:"události"}[inf.event_invites.length] || "událostí") + '</a></li> '+
						'<li id="fb-i-groups"><a target="_blank" href="http://www.facebook.com/reqs.php#group_confirm">' + inf.group_invites.length +  space + ({1:"skupina",2:"skupiny",3:"skupiny",4:"skupiny"}[inf.group_invites.length] || "skupin") + '</a></li> '+
					'</ul><div class="clear"></div>';
		this._dom.info.innerHTML = html;
	}
}


JAK.FB.prototype._blist = function() {
		// ziskej muj status
		this.listTable = {};
	var _responseData = function() {
		//var statuses = frInfo = {};
		var _st = function(row) {
			this.listTable[row.uid] = {'message':row.message, 'time':row.time};
		}
		FB.Array.forEach(q_statuses.value, _st.bind(this));

		var _in = function(row) {
				if (this.listTable[row.uid]) {
				this.listTable[row.uid]['first_name'] = row.first_name;
				this.listTable[row.uid]['last_name'] = row.last_name;
				this.listTable[row.uid]['pic_square'] = row.pic_square;
				this.listTable[row.uid]['uid'] = row.uid;
			}
		}
		FB.Array.forEach(q_frInfo.value,_in.bind(this));

		this._responseData();
	}

	var query = FB.Data.query('select uid2 from friend where uid1={0}', FB.getSession().uid)
	var q_statuses = FB.Data.query('select uid,time,message,source from status where uid in (select uid2 from {0}) order by time desc limit 50', query);
	var q_frInfo = FB.Data.query('select uid,first_name,last_name,pic_square,is_blocked from user where uid in (select uid2 from {0})', query);

	FB.Data.waitOn([query, q_statuses, q_frInfo], _responseData.bind(this));
}

/* naparsuje statusy pratelu a udela instance itemu */
JAK.FB.prototype._responseData = function (node) {
	//this.noClearFlag = false;
	//this.dom.loader.style.display = 'none';
	this.listArray = []
	for (var i in this.listTable) {this.listArray.push(this.listTable[i])};
	this.listArray.sort(function (a,b) { return b.time - a.time; });
	this._draw();
};

JAK.FB.prototype._draw = function () {
	var c = this._dom.list;
	JAK.DOM.clear(c);
	var pageSize = parseInt(this.itemsCount);
	var start = pageSize * this.page;
	var end = Math.min(start + pageSize, this.listArray.length);

	for (var i=start; i<end; i++) {
		var node = this._buildItem(this.listArray[i]);
		c.appendChild(node);
	}
	c.appendChild(this._dom.bottom);

	this._dom.prev.style.display = (this.page > 0 ? "" : "none");
	this._dom.next.style.display = (end < this.listArray.length ? "" : "none");
};

JAK.FB.prototype._prev = function (e, elm) {
	JAK.Events.cancelDef(e);
	this.page--;
	this._draw();
};

JAK.FB.prototype._next = function (e, elm) {
	JAK.Events.cancelDef(e);
	this.page++;
	this._draw();
};

JAK.FB.prototype._buildItem = function(obj) {
	var div = JAK.cel('div', 'fb-item');
	var pS = this.fbPictureShow;
	var html = '';
	if (pS && obj.pic_square != null) {
		 html =
			'<div class="fb-picture">'+
				'<a target="_target" href="http://www.facebook.com/profile.php?id=' + obj.uid + '"><img src="' + obj.pic_square + '" width="40" height="40" class="fb-foto" /></a>'+
			'</div>';
	}
	html += '<div class="'+ (pS ? 'fb-text' : 'fb-text-no') +'">'+
	'<strong><a target="_target" href="http://www.facebook.com/profile.php?id=' + obj.uid + '" title="' + obj.first_name.replace(/</,'&lt;') + ' ' + (obj.last_name ? obj.last_name.replace(/</,'&lt;') : '') + '">' + obj.first_name.replace(/</,'&lt;') + '</a></strong> '
			+ this._wordBrakes(obj.message.replace(/</,'&lt;')) + ' <span class="fb-time">' + this._niceDate(obj.time*1000) + '</span>'+
		'</div>'+
		'<div class="clear"></div>';
	div.innerHTML = html;
	return div;
};

JAK.FB.prototype._wordBrakes = function(txt) {
	return txt.replace(/([^\s]{30})/g, '$1&#8203;');
};

