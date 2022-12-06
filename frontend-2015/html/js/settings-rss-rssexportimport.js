/**
 * @class
 * JAK.Homepage.RSS.RSSExportImport reprezentuje import a export
 * @param {object} parent odkaz na nadrizenou tridu
 * @param {object} html HTML struktura dat pro E/I
 */
JAK.Homepage.RSS.RSSExportImport = JAK.ClassMaker.makeClass({
	NAME:"JAK.Homepage.RSS.RSSExportImport",
	VERSION:"1.0"
})

JAK.Homepage.RSS.RSSExportImport.prototype.$constructor = function (parent, html) {
	this.parent = parent;
	this.html = html;

	this.dom = {};
}

/**
 * vyrobi html pro export a import z OPML
*/
JAK.Homepage.RSS.RSSExportImport.prototype.build = function () {
	this.dom.link = JAK.cel('a', null, 'ei-link');
	this.dom.link.href = "#";
	this.dom.link.innerHTML = 'Import a export vlastního obsahu';
	this.html.appendChild(this.dom.link);

	JAK.Events.addListener(this.dom.link, 'click', this, this._openPopup);
}

/**
 * otevre popup okno
 * @private
 * @param {object} e udalost
 * @param {object} elm HTML prvek s navesenou udalosti
 */
JAK.Homepage.RSS.RSSExportImport.prototype._openPopup = function (e, eml) {
	JAK.Events.cancelDef(e);
	var winW = 400;
	var winH = 300;

	var screenW = window.screen.width;
	var screenH = window.screen.height;
	var xPos = Math.round(screenW/2 - winW);
	var yPos = Math.round(screenH/2 - winH);
	var strWindowFeatures = "menubar=no,location=no,resizable=no,scrollbars=no,status=no,width=" + winW + ",height=" + winH + ",top=" + yPos + ",left=" + xPos;
	this.window = window.open('/export-zprav-opml?mode=popup', 'eiWin', strWindowFeatures);
	//this.window.document.write(htmlForPopup);
	this.window.document.close();
	this.window.focus();
}

/**
 * zavre popup okno a aktualizuje moje feedy, je volano z popup Okna
 */
JAK.Homepage.RSS.RSSExportImport.prototype.closePopup = function () {
	this.window.close();
	window.focus();
	this.parent.RSSComponents[0].updateMyFeeds('user');
}
