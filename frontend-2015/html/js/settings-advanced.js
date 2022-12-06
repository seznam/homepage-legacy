/**
 * @class
 * JAK.Advanced sprava hledani, ikonek. Trida zastresujici tridy <b>JAK.Homepage.Advanced.Seek</b>,
 * <b>JAK.Homepage.Advanced.Suggest</b> a <b>JAK.Homepage.Advanced.Promote</b>
 * @property {int} requestCount pocet requestu vsech podtrid (komponent)
 */
JAK.Homepage.Advanced = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.Advanced",
	VERSION:"1.0"
})

JAK.Homepage.Advanced.prototype.$constructor = function (html, suggest) {
	this.dom = {};
	this.ev = {};
	this.settings = {};
	this.requestCount = 2;
	this.html = JAK.gel(html);
	this.components = [];
	this.suggest = suggest;

	this._build();
}

/**
 * vola metodu <b>_createHTML</b>
 * @private
 */
JAK.Homepage.Advanced.prototype._build = function () {
	this._createHTML();
}

/**
 * vytvori zakladni html strukturu pro rozsirene nastaveni
 * @private
 */
JAK.Homepage.Advanced.prototype._createHTML = function () {
	this.dom.html =
		'<div class="section-title">'+
			'<h2>'+
				'Pokročilé nastavení:'+
			'</h2>'+
			'<p>'+
				'Pokročilé nastavení Vám nabízí možnost změny pořadí hledacích služeb, vypnutí a zapnutí našeptávače a obnovu výchozího nastavení.	'+
				'<br /><a id="video-advanced" href="#" class="video-link">Video návod</a>'+
			'</p>'+
		'</div>'+
		'<div class="section-cnt">'+
			'<h3>Nastavení hledání</h3>'+
			'<a name="hledani"></a>'+
			'<div id="seek">'+
			'</div>'+
			'<div class="clear"></div>'+
			'<h3>Našeptávač</h3>'+
			'<div id="sugg">'+
			'</div>'+
			'<div class="clear"></div>'+
			'<h3>Ikona pro webmastery</h3>'+
			'<div id="icon">'+
			'</div>'+
			'<div class="clear"></div>'+
			'<h3>Výchozí nastavení</h3>'+
			'<div id="default">'+
			'<p>Hlavní stránku můžete vrátit do původní podoby kliknutím na odkaz:</p>'+
			'<p><a id="sett-default" href="/nastavit-vychozi?hashId=' + Homepage.CONF.HASHID + '">Nastavit Seznam.cz do výchozího nastavení</a></p>'
			'</div>'+
			'<div class="clear"></div>'+
		'</div>'+
		'<div class="clear"></div>';

	//vytvoreni okna
	var params = {imagePath:'/st/img/shadows/shadow-'};
	this.w = new JAK.Window(params);
	//nastaveni obsahu
	var code = JAK.cel("div");
	code.innerHTML =
	'<a href="#" class="close-window">Zavřít</a>'+
	'<div class="video-cont">'+
		'<object height="324" width="576" data="/st/img/video/videoplayer.swf?video_src=/st/img/video/nastaveni-hledani.flv&amp;image_src=/st/img/video/nastaveni-hledani.jpg" type="application/x-shockwave-flash" id="VideoSpot">'+
			'<param value="/st/img/video/videoplayer.swf?video_src=/st/img/video/nastaveni-hledani.flv&amp;image_src=/st/img/video/nastaveni-hledani.jpg" name="movie">'+
			'<param value="always" name="allowScriptAcess">'+
			'<param value="high" name="quality">'+
			'<param value="noScale" name="scale">'+
			'<param value="TL" name="salign">'+
			'<param value="true" name="allowfullscreen">'+
			'<param value="playerMode=embedded" name="FlashVars">'+
		'</object>'+
	'</div>';

	this.w.hide();
	this.w.container.style.position = 'absolute';
	document.body.insertBefore(this.w.container,document.body.firstChild);
	this.w.content.appendChild(code);

	this.html.innerHTML = this.dom.html;
	this.html.search = JAK.gel('seek');
	this.dom.sugg = JAK.gel('sugg');
	this.dom.icon = JAK.gel('icon');
	this.dom.buttonSetDef = JAK.gel('sett-default');
	this.dom.videoAdvanced = JAK.gel('video-advanced');

	this.ev.videoAdvancedClose = JAK.Events.addListener(JAK.DOM.getElementsByClass('close-window',this.w.container,'a')[0], 'click', this, this._showVideo);
	this.ev.videoAdvanced = JAK.Events.addListener(this.dom.videoAdvanced, 'click', this, this._showVideo);

	this.ev.buttonSetDef = JAK.Events.addListener(this.dom.buttonSetDef, 'click', this, this._defaultConfirm);

	// naplnit obsah
	this.components.push(new JAK.Homepage.Advanced.Suggest(this.dom.sugg, this.suggest));
	this.components.push(new JAK.Homepage.Advanced.Promote(this.dom.icon));
	this.components.push(new JAK.Homepage.Advanced.Seek(this.html.search));
};

/**
 * ukazuje video napovedu
 * @private
 */
JAK.Homepage.Advanced.prototype._showVideo = function (e, elm) {
	JAK.Events.cancelDef(e);
	if (this.w.container.style.display == 'none') {
		var pos = JAK.DOM.getBoxPosition(elm);
		this.w.container.style.top = (pos.top-80)+'px';
		this.w.container.style.left = (pos.left+elm.offsetWidth+5)+'px';
		this.w.show();
	} else {
		this.w.hide();
	}
}

/**
 * provede zavolani metod submit vsech registrovanych komponent
 */
JAK.Homepage.Advanced.prototype.submit = function (_submitCallBack) {
	this._submitCallBack = _submitCallBack;
	for(var i = 0; i < this.components.length; i++) {
		this.components[i].submit();
	}
}

/**
 * confirmne defaultni nastaveni
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek, na kterem je navesen posluchac
*/
JAK.Homepage.Advanced.prototype._defaultConfirm = function (e, elm) {
	if (!window.confirm('Opravdu chcete nastavit Seznam.cz do výchozího nastavení?')) {
		JAK.Events.cancelDef(e);
	}
}
