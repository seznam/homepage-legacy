JAK.Jumplist = JAK.ClassMaker.makeClass({
	NAME : 'JAK.Jumplist',
	VERSION : '1.0'
});

JAK.Jumplist.prototype.$constructor = function() {
	this._ec = {};
	this._dom = {};

	this._menu = null;

	JAK.Events.onDomReady(this, this._init);
};

JAK.Jumplist.prototype.$destructor = function() {
	for(var i in this.actionFolder){
		SZN.Events.removeListener(this.actionFolder[i]);
	}

	for(var i in this){
		this[i] = null;
	}
};

JAK.Jumplist.prototype._init = function() {
	this._menu = JAK.gel('s-links');

	try {
		if(window.external && ("msIsSiteMode" in window.external)){
			if(window.external.msIsSiteMode()){
				try {
					/* pridam jumplist */
					this._makeJumplist();
				} catch(e){};
			} else {
				/* pridam ikonu na pridani do sitemode */
				try {
					this._makeMenuItem();
					menu.addLink(this._dom.link);
				} catch(e){};
			}
		}
	} catch(e) {};
};

JAK.Jumplist.prototype._makeMenuItem = function() {
/*
	this._dom.li = JAK.mel("li", {id:"set-jump"});
	this._dom.a = JAK.mel("a", {href:'#', innerHTML: '<span class="i"></span><span class="t">Přidat na lištu</span></a>'});
	JAK.DOM.append([this._dom.li, this._dom.a], [this._menu,this._dom.li]);

	this._ec.open = JAK.Events.addListener(this._dom.li,'click',this,'_start');
*/
};

JAK.Jumplist.prototype._start = function(e,elm) {
	JAK.Events.stopEvent(e);
	JAK.Events.cancelDef(e);
	window.external.msAddSiteMode();
};

JAK.Jumplist.prototype._makeJumplist = function() {
	var ext = window.external;
	ext.msSiteModeCreateJumplist("Seznam."+_tld);
	ext.msSiteModeAddJumpListItem("Firmy.cz","http://www.firmy."+_tld,Homepage.CONF.SERVICE_URL+Homepage.CONF.PATH_IMG+"/firmy.ico");
	ext.msSiteModeAddJumpListItem("E-mail.cz","http://www.email."+_tld,Homepage.CONF.SERVICE_URL+Homepage.CONF.PATH_IMG+"/email.ico");
	ext.msSiteModeAddJumpListItem("Stream.cz","http://www.stream."+_tld,Homepage.CONF.SERVICE_URL+Homepage.CONF.PATH_IMG+"/stream.ico");
	ext.msSiteModeAddJumpListItem("Prozeny.cz","http://www.prozeny.cz",Homepage.CONF.SERVICE_URL+Homepage.CONF.PATH_IMG+"/prozeny.ico");
	ext.msSiteModeAddJumpListItem("Super.cz","http://www.super."+_tld,Homepage.CONF.SERVICE_URL+Homepage.CONF.PATH_IMG+"/super.ico");
	ext.msSiteModeAddJumpListItem("Sport.cz","http://www.sport."+_tld,Homepage.CONF.SERVICE_URL+Homepage.CONF.PATH_IMG+"/sport.ico");
	ext.msSiteModeAddJumpListItem("Novinky.cz","http://www.novinky."+_tld, Homepage.CONF.SERVICE_URL+Homepage.CONF.PATH_IMG+"/novinky.ico");
	ext.msSiteModeShowJumplist();
};

var jumplist = new JAK.Jumplist();
