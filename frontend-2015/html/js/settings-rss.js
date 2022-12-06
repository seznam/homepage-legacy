/**
 * @class
 * JAK.Homepage.RSS sprava rss, import a export
 * @augments JAK.Homepage.AbstractSetting
 * @see JAK.Homepage.AbstractSetting
 * @property {object} settings
 * @property feeds {JAK.Homepage.RSS.Feed} pole feedu
 */
JAK.Homepage.RSS = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.RSS",
	VERSION:"1.0",
	EXTEND: JAK.Homepage.AbstractSetting
})

/**
 * @private
 * fadovaci fce pro CSSInterpolator
 */
JAK.Homepage.RSS.fade = function (x) {
	var out = Math.abs(Math.cos((Math.pow(x,2))/2 * Math.PI));
		return out;
}

JAK.Homepage.RSS.prototype.$constructor = function (html, option) {
	this.TOP_LEVEL = true;
	this.option = typeof option != 'undefined' ? option : null;
	this.dom = {};
	this.ev = {};
	this.settings = {};
	this.requestCount = 1;
	this.html = JAK.gel(html);

	// vyrobime zakladni strukturu
	this._build();

	//registrace komponent
 	this.RSSComponents = [new JAK.Homepage.RSS.RSSMy(this, this.dom.feedSeek, this.option), new JAK.Homepage.RSS.RSSList(this, this.dom.groupList), new JAK.Homepage.RSS.RSSExportImport(this, this.dom.exportImport)];

	/* komponenty vyrobi k */
	var _build = function (element, index, array) {
		element.build();
	}
	this.RSSComponents.forEach(_build, this);
}

/**
 * @see JAK.Homepage.InterfaceSettings#submit
 * zavola submit u tech komponent, ktere ho maji
 */
JAK.Homepage.RSS.prototype.submit = function (_submitCallBack) {
	this._submitCallBack = _submitCallBack;
	/* komponenty vyrobi k */
	var _submit = function (element, index, array) {
		if (typeof element.submit != 'undefined') {
			element.submit();
		}
	}

	this.RSSComponents.forEach(_submit, this);

	var ids = [];
	for (var i = 0; i < JAK.Homepage.Settings.feeds.length; i++) {
		if (JAK.Homepage.Settings.feeds[i] != '') {
			ids.push(JAK.Homepage.Settings.feeds[i]);
		}
	}
	ids = ids.join(',');

	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_response');
	//nahodim loader
	JAK.loader.show();
	rq.send('/jsFeedProcess', 'hashId=' + Homepage.CONF.HASHID + '&id=' + ids);
}

/**
 * vyrobi zakladni HTML strukturu
 * @private
 */
JAK.Homepage.RSS.prototype._build = function () {
	this.dom.html =
		'<div class="section-title">'+
			'<a name="obsah"></a>'+
			'<h2>'+
				'Přidat si obsah:'+
			'</h2>'+
			'<p>'+
			'Věděli jste, že si můžete na Seznam přidat libovolný obsah?<br /> <a href="http://napoveda.seznam.' + _tld + '/cz/co-je-to-rss-a-k-cemu-slouzi.html">Zajímá Vás co je to RSS a k čemu slouží?</a>'+
			'<br /><a id="video-rss" href="#" class="video-link">Video návod</a>'+
			'</p>'+
		'</div>'+
		'<div class="section-cnt">'+
			'<h3 id="rss-title">Vlastní obsah - <span>RSS</span></h3>'+
			'<div id="feed-seek"></div>'+
			'<div id="export-import"></div>'+
			'<div id="group-list"></div>'+
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
		'<object height="324" width="576" data="/st/img/video/videoplayer.swf?video_src=/st/img/video/pridat-obsah.flv&amp;image_src=/st/img/video/pridat-obsah.jpg" type="application/x-shockwave-flash" id="VideoSpot">'+
			'<param value="/st/img/video/videoplayer.swf?video_src=/st/img/video/pridat-obsah.flv&amp;image_src=/st/img/video/pridat-obsah.jpg" name="movie">'+
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

	this.dom.feedSeek = JAK.gel('feed-seek');
	this.dom.exportImport = JAK.gel('export-import');
	this.dom.groupList = JAK.gel('group-list');

	this.dom.videoRss = JAK.gel('video-rss');

	this.ev.videoRssClose = JAK.Events.addListener(JAK.DOM.getElementsByClass('close-window',this.w.container,'a')[0], 'click', this, this._showVideo);
	this.ev.videoRss = JAK.Events.addListener(this.dom.videoRss, 'click', this, this._showVideo);
}

/**
 * ukazuje video napovedu
 * @private
 */
JAK.Homepage.RSS.prototype._showVideo = function (e, elm) {
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
