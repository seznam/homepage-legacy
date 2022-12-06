
var LampEffect = JAK.ClassMaker.makeClass({
	NAME : 'LampEffect',
	VERSION : '1.0'
});

LampEffect.prototype.$constructor = function(radiusImageUrl,opt){
	this.dom = {};
	this.ec = [];

	this._opt = {
		darkTheme:false
	}
	for(var key in opt){
		this._opt[key] = opt[key];
	}

	this.img = new Image();
	this.img.src = radiusImageUrl;

	this.bodySize = JAK.DOM.getDocSize();
	this.power = false;
	this.compatibilityForIE = this._browserTest();
	this.enableSaving = false; /** nastavime na true pouze v intervalu kdy je lampa rovnou zhasnuta **/
	this.cookieTest = navigator.cookieEnabled || ("cookie" in document && (document.cookie.length > 0 || (document.cookie = "test").indexOf.call(document.cookie, "test") > -1)); /** otestujeme jestli muzeme ukladat cookie **/
	this.cookie = JAK.Cookie.getInstance();
	this.adsInitied = false;

	this._init();
	this.ec.push(JAK.Events.addListener(window,"load",this,"_setOriginPosition"));
};

LampEffect.prototype._init = function(){
    if((navigator.userAgent.match(/iPhone/i)) ||  (navigator.userAgent.match(/iPod/i))) {
        this._loadAds();
    }else{
	    var now = new Date();
	    var from = new Date(2012,2,31,20,30,0);
	    var to = new Date(2012,2,31,21,30,0);

	    this._buildLamp();
	    this._link();

	    /** pokud jsme v intervalu zobrazeni, zobrazime **/
	    if(now >= from && now <= to){
            this.enableSaving = true;
            if(this.cookieTest == true){
                var cookie = this.cookie.get("sznhomepage");
		        if(cookie=="lamp-show" || cookie==null){
			        this._show();
		        }else{
			        this._loadAds();
		        }
	        }
        }else{
    	    this._loadAds();
        }
	    this._setOriginPosition();
    }
}

LampEffect.prototype._browserTest = function(){
	if(JAK.Browser.client == "ie" && JAK.Browser.version <= 8){
		return false;
	}else{
		return true;		
	}
};

LampEffect.prototype._buildLamp = function(){
	document.body.style.position = "relative"; /*- fix overflow pro starsi ie -*/
	this.dom.main = JAK.mel('div', { className : 'lampMain' } );
	document.body.appendChild(this.dom.main);

	this.dom.controls = JAK.mel('div', { id : 'lampControls' } );
	if(this._opt.darkTheme == true){
		JAK.DOM.addClass(this.dom.controls,"darkTheme");	
	}
	JAK.DOM.addClass(this.dom.controls,"on");
	document.body.appendChild(this.dom.controls);

	/*- nastaveni pruhlednosti pokud nefixujeme IE -*/
	if( this.compatibilityForIE == false ){
		this._buildIE();
	}else{
		JAK.DOM.setStyle(this.dom.main,{opacity:"0.93"});
	}
};

LampEffect.prototype.setOriginPosition = function(){
	this._setOriginPosition();
};
LampEffect.prototype._setOriginPosition = function(){
	var logo = JAK.gel("seznam-logo");
	var logoPosition = JAK.DOM.getBoxPosition(logo);
	var left = logoPosition.left - 55 + "px";
	var top = logoPosition.top - 135 + "px";
	JAK.DOM.setStyle(this.dom.main,{left:left, top:top});
};

LampEffect.prototype._move = function(e, elm){
	var scroll = JAK.DOM.getScrollPos();

	var pos = {
		x : e.clientX - this.img.width/2,
		y : e.clientY - this.img.height/2
	};

	this.dom.main.style.left = pos.x+'px';
	this.dom.main.style.top = pos.y+'px';

	if( this.compatibilityForIE == false ){
		this.dom.correctDivLeft.style.left = pos.x-10001+"px";
		this.dom.correctDivRight.style.left = pos.x+350+"px";
		
		this.dom.correctDivTop.style.top = pos.y-10001+"px";
		this.dom.correctDivTop.style.left = pos.x+"px";
		
		this.dom.correctDivBottom.style.top = pos.y+350+"px";
		this.dom.correctDivBottom.style.left = pos.x+"px";
	}
};

LampEffect.prototype._link = function(){
	this.ec.push( JAK.Events.addListener(document, 'mousemove', this, '_move') );
	this.ec.push( JAK.Events.addListener(window, 'scroll', this, '_scroll') );
	this.ec.push( JAK.Events.addListener(JAK.gel("lampControls"), 'click', this, '_toggle') );
};

LampEffect.prototype._scroll = function(e, elm){

}

LampEffect.prototype._toggle = function(e, elm){
	if(this.power == true){
		this._hide();
	}else{
		this._show();
	}
};

LampEffect.prototype._hide = function(){
	if(this.enableSaving == true && this.cookieTest == true){
		this._setCookie("lamp-hide");
	}
	JAK.DOM.setStyle(this.dom.main,{display:"none",visibility:"hidden"});
	JAK.DOM.addClass(this.dom.controls,"on");
	document.body.style.overflow = "";
	if( this.compatibilityForIE == false ){
		JAK.DOM.setStyle(this.dom.correctDivLeft,{display:"none",visibility:"hidden"});
		JAK.DOM.setStyle(this.dom.correctDivRight,{display:"none",visibility:"hidden"});
		JAK.DOM.setStyle(this.dom.correctDivTop,{display:"none",visibility:"hidden"});
		JAK.DOM.setStyle(this.dom.correctDivBottom,{display:"none",visibility:"hidden"});
	}
	this.power = false;
	this._loadAds();
};

LampEffect.prototype._show = function(){
	if(this.enableSaving == true && this.cookieTest == true){
		this._setCookie("lamp-show");
	}
	JAK.DOM.setStyle(this.dom.main,{display:"block",visibility:"visible"});
	JAK.DOM.removeClass(this.dom.controls,"on");
	document.body.style.overflowX = "hidden";
	if( this.compatibilityForIE == false ){
		JAK.DOM.setStyle(this.dom.correctDivLeft,{display:"block",visibility:"visible"});
		JAK.DOM.setStyle(this.dom.correctDivRight,{display:"block",visibility:"visible"});
		JAK.DOM.setStyle(this.dom.correctDivTop,{display:"block",visibility:"visible"});
		JAK.DOM.setStyle(this.dom.correctDivBottom,{display:"block",visibility:"visible"});
	}
	this.power = true;
};

LampEffect.prototype._buildIE = function(){
	this.dom.correctDivLeft = JAK.mel('div', { id : 'lampLeftBox' } );
	JAK.DOM.addClass(this.dom.correctDivLeft,"lampCorrectBox");
	document.body.appendChild(this.dom.correctDivLeft);

	this.dom.correctDivRight = JAK.mel('div', { id : 'lampRightBox' } );
	JAK.DOM.addClass(this.dom.correctDivRight,"lampCorrectBox");
	document.body.appendChild(this.dom.correctDivRight);

	this.dom.correctDivTop = JAK.mel('div', { id : 'lampTopBox' } );
	JAK.DOM.addClass(this.dom.correctDivTop,"lampCorrectBox");
	this.dom.correctDivTop.style.width = "350px";
	document.body.appendChild(this.dom.correctDivTop);

	this.dom.correctDivBottom = JAK.mel('div', { id : 'lampBottomBox' } );
	JAK.DOM.addClass(this.dom.correctDivBottom,"lampCorrectBox");
	this.dom.correctDivBottom.style.width = "350px";
	document.body.appendChild(this.dom.correctDivBottom);
};

LampEffect.prototype._loadAds = function(){
	if(this.adsInitied == false){
		this.adsInitied = true;
		if(!!JAK.aukro == true){
			JAK.aukro.setup();
		}
		if(!!JAK.Advert == true){
			JAK.Advert._getAd();
		}
	}
}

/**
 * @param {string} to - na co nastavime cookie
 **/
LampEffect.prototype._setCookie = function(to){
	var expires = new Date ();
	expires.setMinutes ( expires.getMinutes() + 60 );

	this.cookie.set("sznhomepage",to,{expires:expires});
}



/**
 * @class Nastroj pro praci s cookie 
 * @version 1.0
 */   
JAK.Cookie = JAK.ClassMaker.makeSingleton({
	NAME: "JAK.Cookie",
	VERSION: "1.0"
});

/**
 * Vraci pole nazvu vsech dostupnych cookie dokumentu
 * @returns {array} pole nazvu dostupnych cookie
 */ 
JAK.Cookie.prototype.list = function() {
	var list = document.cookie.split(";").map(
		function(item){
			return item.split("=")[0].trim();
		}
	)
	return list;
};

/**
 * Vraci hodnotu cookie zadaneho jmena, pokud existuje, jinak null
 * @param {string} name nazev cookie, kterou chceme cist
 * @returns {string || null} hodnota cookie nebo null
 */ 
JAK.Cookie.prototype.get = function(name) {
	var index = this.list().indexOf(name);
	if(index == -1 ) {
		return null;
	}

	return document.cookie.split(";")[index].split("=").slice(1).join("=").trim();	
};

/**
 * Nastavuje nebo rusi cookie
 * @param {string} name nazev cookie
 * @param {string || null} hodnota cookie, pokud bude null, cookie se zrusi
 * @param {object} [cookieOptions] dalsi atributu cookie
 * @param {Date} [cookieOptions.expires] datum expirace cookie (instance Date)
 * @param {string} [cookieOptions.path] cesta cookie
 * @param {string} [cookieOptions.domain] domena cookie
 * @param {boolean} [cookieOptions.secure] urcuje zda cookie dstupna pouze pres https
 */ 
JAK.Cookie.prototype.set = function(name, value, cookieOptions) {
	if(value === null) {
		this._remove(name);
		return;
	}
	var opt = this._makeOptions(cookieOptions);
	var ck = name + "=" + value + (opt ? ";" + opt : "");
	document.cookie = ck;		
};

/**
 * Vlastni odebrani cookie (nemusi se projevit okamzite), nastavi cookie
 * prazdnou hodnotu a datum expirace do minulosti 
 * @private 
 * @param {string} name jmeno rusene cookie
 */ 
JAK.Cookie.prototype._remove = function(name) {
	document.cookie = name + "=;expires=" +  new Date(1).toUTCString();	
};

/**
 * Zpracovava (retezi) dalsi atributy cookie
 * @param {object} options dalsi atributy cookie 
 * @see JAK.Cookie#set 
 * @returns {string} zretezene atributy pripravene pro zapis
 */ 
JAK.Cookie.prototype._makeOptions = function(options) {
	var opt = [];
	for(var i in options){
		switch(i){
			case "expires":
				opt.push(i + "=" + options[i].toUTCString());
				break;
			case "secure":
				if(options[i]){
					opt.push(i);
				}
				break;
			case "domain":
			case "path":
				opt.push(i + "=" + options[i]);
				break;
			default:
				break;
		}

	}
	return opt.join(";");
};
