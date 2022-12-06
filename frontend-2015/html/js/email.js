/* email background */
JAK.Email = JAK.ClassMaker.makeClass({
	NAME:"Email",
	VERSION:"1.1"
});
JAK.Email.prototype.$constructor = function (parent,feedId,emailId) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
			return;
	}

	this.feedId = feedId;
	this.parent = parent;
	this.emailId = emailId;
	this.htmlObject = JAK.gel(parent);
	this.eventsCache = new Object();

	var tr = this.htmlObject.getElementsByTagName('TR');

	for (var i = 0; i < tr.length; i++) {
		this.eventsCache['over'+i] = JAK.Events.addListener(tr[i], 'mouseover', this, "_over", false, true);
		this.eventsCache['out'+i] = JAK.Events.addListener(tr[i], 'mouseout', this, "_out", false, true);
		this.eventsCache['out'+i] = JAK.Events.addListener(tr[i], 'click', this, "_click", false, true);
	}

	if (this.feedId == 190) {
		this.gUnlockLink = JAK.gel('gmail-unlock');
		if (this.gUnlockLink) {
			this.eventsCache['unlock-link'] = JAK.Events.addListener(this.gUnlockLink, 'click', this, "_logout", false, true);
		}
	}
};

JAK.Email.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Email.prototype._over = function (e, elm) {
	elm.className += ' over';
};

JAK.Email.prototype._out = function (e, elm) {
	elm.className = elm.className.replace('over','');
};

JAK.Email.prototype._click = function (e, elm) {
	if (e.which && e.which == 2) {
		return;
	}
	var a = elm.getElementsByTagName('A')[0];
	document.location = a.href;
};

JAK.Email.prototype._logout = function (e, elm) {
	JAK.Events.cancelDef(e);
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_logoutRedirect');
	rq.send('/jsForeignEmailLogout', 'hashId=' + Homepage.CONF.HASHID + '&feedId=' + this.feedId + '&emailId=' + this.emailId + '&keepLogin=' + 1);
};

JAK.Email.prototype._logoutRedirect = function () {
	window.location = this.gUnlockLink.href;
};

/* Trida slouzi k ziskani poslenich zprav pomoci FRPC volani */

/*
	Argument conf = {
		rpc_url			string		URL rpc rozhrani
		rpc_method		string		metoda pouzita k ziskani poslenich zprav
		emailCount		int			pocet zobrazovanych zprav (nastaveno userem)
		msg_no_mail		string		hlaska zobrazena kdyz nejsou zadne zpravy
		msg_err_mail	string		hlaska zobrazena kdyz se nepodari ziskat zpravy
		count_box		string		className elementu kam se naplni pocet novych zpravy " (#)"
		message_link	string		URL odkazu do inboxu; obsahuje %folderId% a %messageId% jez se nahradi odpovidajicimi hodnotami
		container		string		id elementu do nejz se bude nalevat tabulka

		domain			string		domena pod kterou je uzivatel prihlasen
		username		string		jmeno prihlasenene uzivatele
	}
*/

/* by Gindar */
JAK.EmailCreator = JAK.ClassMaker.makeClass({
	NAME:"EmailCreator",
	VERSION:"1.0"
});

JAK.EmailCreator.prototype.$constructor = function(conf){
	this.forbidden = false;
	this.conf = conf;
	this.container = conf["container"];
	this.contEl = JAK.gel(this.container);
	this.gadgetEl = JAK.gel(conf["gadgetId"]);
	this.line_height = 28;
	if( this.conf["emailCount"] == 0 ){
		this.contEl.style.height = 34+"px";
	}else{
		this.contEl.style.height = (this.line_height*this.conf["emailCount"])+"px";
	}
	this.contEl.style.background = "url(/st/img/load.gif) center center no-repeat";
	this.contEl.style.paddingTop = 20 +'px';
	this.data = null;
	//setTimeout( this.sendRequest.bind(this), 2000 )
	this.sendRequest();
}

JAK.EmailCreator.prototype.sendRequest = function(){
	/* Pokusim se odeslat request */
	try{
		this.rpc = new JAK.RPC(JAK.RPC.AUTO, { endpoint : this.conf["rpc_url"] });
		this.rpc.setErrorCallback(this.rpcError.bind(this));
		this.rpc.setCallback( this, "recieveData" );
	} catch(e){
		this.handleErrors(e);
	}
	try{
		this.rpc.send( this.conf["rpc_method"], [], {});
	} catch(e){
		this.handleErrors(e);
	}
}

JAK.EmailCreator.prototype.recieveData = function(data,status){
	JAK.DOM.removeClass(this.gadgetEl, 'disabledService');
	/* Vratila se mi odpoved, pokud je vse ok, pak buildim tabulku */
	if( status != 200 ){
		if( status == 403 ) {
			/* nastavime forbidden aby se prestal v intervalu posilat request na nove zpravy */
			this.forbidden = true;
			
			this.buildLoginForm();
		}
		else {
			this.handleErrors(status);
		}
	} else {
		var statusMsg = "";
		if (data && data.statusMessage) {
			statusMsg = data.statusMessage.toLowerCase();
		}
		if (statusMsg.indexOf("mailbox is currently disabled") > -1) {
			this.forbidden = true;
			this.contEl.innerHTML = '';
			JAK.DOM.addClass(this.gadgetEl, 'disabledService');
			this.buildInfo("msg_disable_mail");
			this.buildPassForm();
			return;
		}

		this.data = {};
		this.data["msgcount"] = data["newMessages"];
		this.data["messages"] = [];
		for( var i = 0; i < 1*this.conf["emailCount"]; i ++ ){
			if( i >= data["from"].length ){ break; }
			msgdata = {
				"from": data["from"][i],
				"folderId": data["folderId"][i],
				"messageId": data["messageId"][i],
				"abstract": data["abstract"][i],
				"subject": data["subject"][i],
				"timestamp": data["timestamp"][i],
				//"from": data["from"][i],
				"unread": (data["flags"][i].indexOf("U")!=-1),
				"last": 0
			}
			this.data["messages"].push( msgdata );
		}
		this.build();
	}
}

JAK.EmailCreator.prototype.rpcError = function(e){
	this.handleErrors(e);
}

JAK.EmailCreator.prototype.handleErrors = function(e){
	this.data = null;
	this.build();
}

JAK.EmailCreator.prototype.buildInfo = function(msg) {
	this.contEl.style.background = "transparent";
	this.contEl.style.paddingTop = 0;
	this.contEl.style.height = "auto";
	var p = JAK.cel("p", "altInfo");
	p.innerHTML = this.conf[msg];
	this.contEl.appendChild(p);
}

JAK.EmailCreator.prototype.buildPassForm = function() {
	var form = JAK.mel("form", { className:"altForm", method:"post", action:this.conf["secureLogin"] });
	var s = "";
	//s += "<input type='hidden' name='loggedURL' value='"+this.conf["emailUrl"]+"' />";
	s += "<input type='hidden' name='serviceId' value='email' />";
	s += "<input type='hidden' name='loggedURL' value='http://www.seznam."+_tld+"/' />";  //v pripade aktivace sluzby je tato volba stejne ignorovana a je presmerovano na email
	s += "<input type='hidden' name='forceSSL' value='0' />";
	s += "<input type='hidden' name='domain' value='"+this.conf["domain"]+"' />";
	s += "<input type='hidden' name='username' value='"+this.conf["username"]+"' />";
	s += "<p>Uživatelské jméno: <strong>"+this.conf["username"]+"@"+this.conf["domain"]+"</strong></p>";
	s += "<p>";
	s += "<label for='password'>Heslo:</label>";
	s += "<input tabindex='2' class='login sh' size='8' id='password' name='password' type='password' />";
	s += "<input type='submit' value='Přihlásit se' class='sub button' tabindex='4' />";
	s += "<input type='hidden' name='ja' id='js' value='0' />";
	s += "</p>";
	form.innerHTML = s;

	this.contEl.appendChild(form);
}

JAK.EmailCreator.prototype.buildLoginForm = function() {
	var form = "<form id='login-form' class='forbbiden' action='"+this.conf["secureLogin"]+"' method='post'>";
    form += "<input type='hidden' name='loggedURL' value='"+this.conf["emailUrl"]+"' />";
   	form += "<input type='hidden' name='serviceId' value='email' />";
    form += "<input type='hidden' name='forceSSL' value='0' />";
    form += "<input type='hidden' name='domain' value='"+this.conf["domain"]+"' />";
    form += "<input type='hidden' name='username' value='"+this.conf["username"]+"' />";
    form += "<p>Pro zobrazení vyplňte z bezpečnostních důvodů heslo.</p>";
	form += "<p>Uživatelské jméno <strong>"+this.conf["username"]+"@"+this.conf["domain"]+"</strong></p>";
	form += "<p>";
	form += "<label for='password'>Heslo:</label>";
	form += "<input tabindex='2' class='login sh' size='8' id='password' name='password' type='password' />";
	form += "<input type='submit' value='Přihlásit se' class='sub button' tabindex='4' />";
	form += "<input type='hidden' name='ja' id='js' value='0' />";
	form += "</p>";
	form += "</form>";

	this.contEl.innerHTML = form;
	this.contEl.style.background = "none";
	this.contEl.style.paddingTop = 0;
	this.contEl.style.height = "auto";
}

JAK.EmailCreator.prototype.build = function(){
	this.contEl.style.background = "transparent";
	this.contEl.style.paddingTop = 0;
	JAK.DOM.clear(this.contEl);
	if( (1*this.conf["emailCount"]) == 0 ){
		try {
			if( this.data["msgcount"] > 0 ){
				var count_box = JAK.DOM.getElementsByClass(this.conf["count_box"])[0];
				count_box.innerHTML = " ("+this.data["msgcount"]+")";

				var messageEnd = '';

				if( this.data["msgcount"] == 1 ){
					messageEnd = ' novou zprávu.';
				}else if( this.data["msgcount"] == 1 ){
					messageEnd = ' nové zprávy.';
				}else{
					messageEnd = ' nových zpráv.';
				}
				var messageText = "Máte " + this.data["msgcount"] + messageEnd;

				var h5 = JAK.cel("h5");
				h5.appendChild( JAK.ctext( messageText ) );
				//h5.style.lineHeight = this.line_height+"px";
				h5.style.paddingTop = '20px';
				h5.style.textAlign = "center";
				this.contEl.appendChild( h5 );
				this.contEl.style.height = "auto";
			}else{
				var h5 = JAK.cel("h5");
				h5.appendChild( JAK.ctext( this.conf['msg_no_mail'] ) );
				//h5.style.lineHeight = this.line_height + "px";
				h5.style.paddingTop = '20px';
				h5.style.textAlign = "center";
				this.contEl.appendChild( h5 );
				this.contEl.style.height = "auto";
			}
		} catch (e){};
	}else{
		if( this.data ){
			if( this.data["msgcount"] > 0 ){
				var count_box = JAK.DOM.getElementsByClass(this.conf["count_box"]);

				for (var i = 0; i < count_box.length; i++) {
					count_box[i].innerHTML = " ("+this.data["msgcount"]+")";
				};
			}
			try {
				this.contEl.style.height = "auto";
				this.buildTable();
			} catch (e){};
		} else {
			try {
				this.buildMessage("msg_err_mail");
			} catch (e){};
		}
	}
}

JAK.EmailCreator.prototype.buildMessage = function(msg){
	var h5 = JAK.cel("h5");
	h5.innerHTML = this.conf[msg];
	//h5.style.lineHeight = (this.line_height*this.conf["emailCount"])+"px";
	h5.style.paddingTop = ((Math.round(this.line_height*this.conf["emailCount"]/2)) - Math.round(this.line_height/2))+'px';
	h5.style.textAlign = "center";
	this.contEl.appendChild( h5 );

}

JAK.EmailCreator.prototype.buildTable = function(){
	//var table = JAK.cel("table");
	var table = JAK.cel("div", 'table');
	for( var index = 0; index < this.data["messages"].length; index ++ ){
		//this.buildLine( table, this.data["messages"][index], index );
		this.buildLine1( table, this.data["messages"][index], index );
	}
	this.contEl.appendChild( table );
	if( this.data["messages"].length == 0 ){
		this.buildMessage("msg_no_mail");
	}
}

JAK.EmailCreator.prototype.buildLine = function(table,data,index){
	var trclass = data["unread"]?"newMes":"";
	trclass += (index%2)?" odd":" even";

	var link_url = this.conf["message_link"];
	link_url = link_url.replace("%folderId%",data["folderId"]);
	link_url = link_url.replace("%messageId%",data["messageId"]);

	var tr = JAK.cel("tr", trclass);
	tr.__link = link_url;
	JAK.Events.addListener( tr, "mouseover", this._mouseover );
	JAK.Events.addListener( tr, "mouseout", this._mouseout );
	JAK.Events.addListener( tr, "click", this._click );

	var td = JAK.cel("td", "");
		td.setAttribute( "title", data["abstract"] );

	var div = JAK.cel("div");
		var strong = JAK.cel("strong");
			var link = JAK.cel("a");
				link.setAttribute("href",link_url);
				link.appendChild( JAK.ctext( data["from"] ) );
			strong.appendChild( link );
		div.appendChild( strong );

		var span = JAK.cel("span");
			span.appendChild( JAK.ctext( "- "+data["subject"] ) );

			var spanperex = JAK.cel("span","perex");
				var perex = (data["abstract"]!="")?"- "+data["abstract"]:"";
				spanperex.appendChild( JAK.ctext( perex ) );
			span.appendChild( spanperex );

		div.appendChild( span );

	td.appendChild( div );


	var tdtime = JAK.cel("td", "etime");
	tdtime.appendChild( JAK.ctext( this.buildDate(data["timestamp"]) ) )

	tr.appendChild( td );
	tr.appendChild( tdtime );
	table.appendChild( tr );
}

JAK.EmailCreator.prototype.buildLine1 = function(table,data,index){
	var trclass = data["unread"]?"newMes":"";
	trclass += (index%2)?" odd":" even";

	var link_url = this.conf["message_link"];
	link_url = link_url.replace("%folderId%",data["folderId"]);
	link_url = link_url.replace("%messageId%",data["messageId"]);

	var tr = JAK.cel("div", 'tr '+trclass);
	tr.__link = link_url;
	JAK.Events.addListener( tr, "mouseover", this._mouseover );
	JAK.Events.addListener( tr, "mouseout", this._mouseout );
	JAK.Events.addListener( tr, "click", this._click );

	var td = JAK.cel("div", "td emailContent");
		td.setAttribute( "title", data["abstract"] );

	var div = JAK.cel("div");
		var strong = JAK.cel("strong");
			var link = JAK.cel("a");
				link.setAttribute("href",link_url);
				link.appendChild( JAK.ctext( data["from"] ) );
			strong.appendChild( link );
		div.appendChild( strong );

		var span = JAK.cel("span");
			span.appendChild( JAK.ctext( "- "+data["subject"] ) );

			var spanperex = JAK.cel("span","perex");
				var perex = (data["abstract"]!="")?"- "+data["abstract"]:"";
				spanperex.appendChild( JAK.ctext( perex ) );
			span.appendChild( spanperex );

		div.appendChild( span );

	td.appendChild( div );

	var innerBox = JAK.cel("span");
	innerBox.appendChild( JAK.ctext( this.buildDate(data["timestamp"]) ) );

	var tdtime = JAK.cel("div", "td etime");
	tdtime.appendChild( innerBox );

	var divClear = JAK.cel("div", "clear");

	tr.appendChild( td );
	tr.appendChild( tdtime );
	tr.appendChild( divClear );

	table.appendChild( tr );
}

JAK.EmailCreator.prototype._mouseover = function( e,elm ){
	JAK.DOM.addClass(elm,"over");
}

JAK.EmailCreator.prototype._mouseout = function( e,elm ){
	JAK.DOM.removeClass(elm,"over");
}

JAK.EmailCreator.prototype._click = function( e,elm ){
	if (e.which && e.which == 2) {
		return;
	}
	location.href = elm.__link;
}


JAK.EmailCreator.prototype.buildDate = function( timestamp ){
	var now = (new Date());
	var nowts = (now.getTime())/1000;
	var nowH = now.getHours();
	var nowM = now.getMinutes();
	var nowS = now.getSeconds();
	var nowT = nowS+nowM*60+nowH*3600;
	var firstMidnight = nowts - nowT;
	var secondMidnight = firstMidnight - 86400;

	var ts = (new Date());
	ts.setTime(timestamp*1000);

	var result = "";
	if( timestamp > firstMidnight ){
		result = ts.format("G:i");
	} else if( timestamp > secondMidnight ) {
		result = "Včera";
	} else {
		result = ts.format("j.\u00A0n."); /* pevna mezera */
	}

	return result;
}

