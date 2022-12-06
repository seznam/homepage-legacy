/**
 * @class
 * Hint trida pro ovladani Hintu zavreni, proklik, ...
 */
JAK.Hint = JAK.ClassMaker.makeClass({
		NAME: 'JAK.Hint',
		VERSION: '1.0'
})

JAK.Hint.prototype.$constructor = function (hintElem, hintClose, hintForm) {
	this.cont = JAK.gel(hintElem);
	this.closeLink = JAK.gel(hintClose);
	this.hintForm = JAK.gel(hintForm);
	this.hintBody = JAK.gel('hint-body');
	this.hint = JAK.gel('hint');

	this._init();
}

JAK.Hint.prototype.$destructor = function () {
	JAK.Events.removeListener(this.click);
	this.cont.parentNode.removeChild(this.cont);
	for (var p in this) { this[p] = null; }
}

JAK.Hint.prototype._init = function () {
	this.desktop = JAK.wmanager.desktop;
	this.click = JAK.Events.addListener(this.closeLink, 'click', this, this._close);
	if (this.hintForm) {
		this.cancelSubmit = JAK.Events.addListener(this.hintForm, 'submit', this, this._submit);
	}
}

JAK.Hint.prototype._submit = function (e, elm) {
	JAK.Events.cancelDef(e);

	var act = this.hintForm.action;
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_executeAnswer');
	rq.send('/jsHintExecute', 'hashId=' + Homepage.CONF.HASHID + '&id=' + act.substring(act.lastIndexOf('=')+1));

}

JAK.Hint.prototype._close = function (e, elm) {
	JAK.Events.cancelDef(e);

	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this, '_process');
	rq.send('/jsCloseWave', 'hashId=' + Homepage.CONF.HASHID);
}

JAK.Hint.prototype._process = function (response) {
	var data = eval("("+response+")");

	if(data.status == 500) {

	} else if(data.status == 200) {
		this.data = data;
		if(data.method == 'closeWave') {
			this._finalize();
		}
	} else if(data.status == 401) {
		alert('Něco je špatně!');
	}
}

JAK.Hint.prototype._executeAnswer = function (responseText,HTTPstatus) {
	this.data = responseText;

	if(HTTPstatus == 200) {
		this._showMessage(true);
	} else {
		this._showMessage(false);
	}
}

JAK.Hint.prototype._showMessage = function (type) {
	if (type) {
		this.hintMessage = this.hintBody.innerHTML;
		JAK.DOM.removeClass(this.hint, 'add-hint');
		this.hintBody.innerHTML = "<span id='ok-ico'></span> Boxík se přidal <a id='goto-hint' href=''>na konec stránky</a>.";
		this.hintForm.style.display = 'none';
	} else {
		this.hintBody.innerHTML = '<span id="ko-ico"></span>Boxík se bohužel nepodařilo přidat. ';
	}
	this.linkHint = JAK.gel('goto-hint');
	this._build();
}

JAK.Hint.prototype._build = function () {
	var helper = JAK.cel('div');
	var code = JAK.DOM.separateCode(this.data)
	helper.innerHTML = code[0];
	helper = helper.removeChild(JAK.DOM.getElementsByClass('s_win',helper, 'div')[0]);
	this.desktop.grids.htmlObjects[0].insertBefore(helper, this.desktop.grids.htmlObjects[0].lastChild);
	eval(code[1]);
	this.linkHint.href = '#' + helper.id;
	JAK.wmanager.addWin(helper);
	window.setTimeout(this._finalize.bind(this), 10000);
}

JAK.Hint.prototype._finalize = function () {
	var ii = new JAK.CSSInterpolator(this.cont, 500, {endCallback:this.$destructor.bind(this)});
	ii.addProperty('opacity', 1, 0);
	ii.addProperty('height', this.cont.offsetHeight, '0', 'px');
	ii.start();
}

function hintInit(imgPath) {
	/*var hintWin = new JAK.HPWindow({imagePath: imgPath, imageFormat:'png', sizes:[5,5,5,5], tableWidth : '98%'}, JAK.gel('hint'));
	var hintArrow = JAK.gel('hint-arrow').style.display = 'block';
	var hintDog = JAK.gel('hint-dog').style.display = 'block';
	hintWin.container.style.zIndex = "";*/
	var hint = new JAK.Hint('hint-cont', 'hint-close', 'hint-form');
}
