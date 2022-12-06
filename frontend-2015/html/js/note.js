JAK.Notes.Note = JAK.ClassMaker.makeClass({
	NAME:"Note",
	VERSION:"1.0"
});
JAK.Notes.Note.prototype.$constructor = function (parent, note, content, parsedContent, selected, filled, hidden) {
	this.parent = parent;
	this.note = note;
	this.content = content;

	this.parsedContent = parsedContent/*.replace(/&amp;/, '&')*/; /* nevim proc se to delalo, ale v soucasne implementaci je to nezadouci */
	this.selected = selected;
	this.hidden = hidden;
	this.opened = this.content != '' ? 1 : 0;
	this.filled = filled;
	this.edited = false;
	this.maxlength = 1024;

	this.eventsCache = new Object();

	this._build();
};

JAK.Notes.Note.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Notes.Note.prototype._build = function () {
	this.item = JAK.cel('DIV');

	this.item.className = (this.hidden == 0 ? 'item open' : 'item'); // puvodne selected
	this.item.className = (this.filled == 0 && this.selected != 1 ? this.item.className + ' empty' : this.item.className);


	var html =
		'<div class="tit">'+
			'<span class="show"><img src="' + Homepage.CONF.PATH_IMG + '/open_note.gif" width="12" heihgt="10" alt="" /></span>'+
			'<span class="tit-cnt">' + (this.content != '' ? this.content.substring(0,30)/*.replace(/&amp;/g, '&')*/ : '<a href="#" class="write-note" title="Založí novou poznámku">Napsat poznámku</a>') + '</span>'+
		'</div>'+
		'<div class="edit-box">' +
		'<a href="" class="edit-note" title="Upravit text poznámky">Upravit</a>' +
				'<a href="" class="save-note bold" style="display:none;" title="Uložit poznámku" />Uložit</a>' +
				'<a href="" class="storno-note" style="display:none;" title="Neuložit změny v poznámce">Storno</a>' +
				'<a href="" class="delete-note" title="Smazat poznámku" />Smazat</a>' +
			'</div>' +
		'<div class="content">'+
			'<span class="hide"><img src="' + Homepage.CONF.PATH_IMG + '/close-note.gif" width="12" heihgt="10" alt="" /><a href="#" class="hide-note">Skrýt</a></span>'+
			'<div class="cnt" title="Kliknutím na text můžete editovat poznámku."><div class="incnt">' + this.parsedContent+ '</div></div>' +
		'</div>' +
		'<div class="corner"></div>';
	this.item.innerHTML = html;

	this.parent.notesElm.appendChild(this.item);


	this.cnt = JAK.DOM.getElementsByClass('cnt', this.item, 'DIV')[0];
	this.cntTit = JAK.DOM.getElementsByClass('tit-cnt', this.item, 'SPAN')[0];


	this.close = JAK.DOM.getElementsByClass('hide', this.item, 'SPAN')[0];
	this.open = JAK.DOM.getElementsByClass('show', this.item, 'SPAN')[0];
	this.writeNote = JAK.DOM.getElementsByClass('write-note', this.cntTit, 'A')[0];
	this.hideNote = JAK.DOM.getElementsByClass('hide-note', this.item, 'A')[0];
	this.eventsCache.close = JAK.Events.addListener(this.close, 'click', this, '_close', false, true);
	this.eventsCache.open = JAK.Events.addListener(this.open, 'click', this, '_open', false, true);

	if (typeof this.writeNote != "undefined") {
		this.eventsCache.writeNote = JAK.Events.addListener(this.writeNote, 'click', this, '_open', false, true);
	}
	this.eventsCache.hideNote = JAK.Events.addListener(this.hideNote, 'click', this, '_close', false, true);
	this.eventsCache.cntEdit = JAK.Events.addListener(this.cnt, 'click', this, '_edit', false, true);
	this.eventsCache.writecntTit = JAK.Events.addListener(this.cntTit, 'click', this, '_open', false, true);

	this.buttSave = JAK.DOM.getElementsByClass('save-note', this.item, 'a')[0];
	this.buttEdit = JAK.DOM.getElementsByClass('edit-note', this.item, 'a')[0];
	this.buttDelete = JAK.DOM.getElementsByClass('delete-note', this.item, 'a')[0];
	this.buttStorno = JAK.DOM.getElementsByClass('storno-note', this.item, 'a')[0];

	this.eventsCache.buttSave = JAK.Events.addListener(this.buttSave, 'click', this, '_save', false, true);
	this.eventsCache.buttEdit = JAK.Events.addListener(this.buttEdit, 'click', this, '_edit', false, true);
	this.eventsCache.buttDelete = JAK.Events.addListener(this.buttDelete, 'click', this, '_delete', false, true);
	this.eventsCache.buttStorno = JAK.Events.addListener(this.buttStorno, 'click', this, '_edit', false, true);

	this.c = JAK.DOM.getElementsByClass('corner', this.item, 'DIV')[0];
};

JAK.Notes.Note.prototype._close = function (e, elm) {
	if(typeof e != 'undefined') {
		JAK.Events.cancelDef(e);
		JAK.Events.stopEvent(e);
	}
	if(this.filled == 0) {
		this.item.className = 'item empty';
	} else {
		this.item.className = 'item';
	}

	if (this.txt) {
		this.txt.value = this._tengUnescape(this.content);
	}

	this.selected = 0;
	this.edited = false;

	this.hidden = 1;

	this._setHidden();

	this.parent.addButtonSetText();
};

JAK.Notes.Note.prototype._open = function (e, elm) {
	if(typeof e != 'undefined') {
		JAK.Events.cancelDef(e);
		JAK.Events.stopEvent(e);
	}
	this.item.className = 'item open';

	if(this.filled == 0) {
		this._buildEdit();
		this.cnt.style.display = "none";
	}

	this.hidden = 0;

	this._setHidden();
};

JAK.Notes.Note.prototype._setHidden = function () {
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this,'_process');
	rq.send('/jsSetNoteVisibility','hashId=' + Homepage.CONF.HASHID + '&note=' + this.note + '&hidden=' + this.hidden);
}

JAK.Notes.Note.prototype._process = function (response) {
	var data = eval("("+response+")");
	if(data.status == 500) {

	} else if(data.status == 200) {
		this.data = data;
		if(data.method == 'setNote') {
			this._afterSave(data);
		} else if(data.method == 'removeNote') {
			this._afterDelete();
		} else if (data.method == 'feedSearch') {
			this._buildSearch();
		} else if (data.method == 'feedAdd') {
			this._finalize();
		} else if (data.method == 'feedSearchdAdd') {
			this._addedMyRSS();
		}
	} else if(data.status == 401) {
		alert('Něco je špatně!');
	}
};

JAK.Notes.Note.prototype._buildEdit = function () {
	if(typeof this.txt == 'undefined') {
		this.editCnt = JAK.cel('div');
		this.editCnt.className = 'txt-box';

		this.txt = JAK.cel('textarea');
		this.txt.className = 'edit';

		this.editCnt.appendChild(this.txt);
		this.cnt.parentNode.insertBefore(this.editCnt, this.cnt);
		
		//pozor, ctrl+v vyvola napr. 1x paste a hned pote 2x keyup
		JAK.Events.addListener(this.txt, 'keyup', this, '_checkMaxLength');
		JAK.Events.addListener(this.txt, 'paste', this, '_checkMaxLength');
	}

};

JAK.Notes.Note.prototype._checkMaxLength = function(e, elm, evId, timeouted) {
	if (!elm) { return; }

	if (!timeouted && e.type == "paste") { //udalost je vyslana DRIVE, nez se prida text -> kratky timeoutik
		setTimeout(this._checkMaxLength.bind(this, e, elm, evId, 1), 10);
		return;
	}

	if (!elm.value) { return; }
	
	if (elm.value.length > this.maxlength) {
		elm.value = elm.value.substr(0, this.maxlength);
		alert('Maximální délka poznámky je ' + this.maxlength + ' znaků');
	}
}

JAK.Notes.Note.prototype._save = function (e, elm) {
	if(typeof e != 'undefined') {
		JAK.Events.cancelDef(e);
		JAK.Events.stopEvent(e);
	}

	if(this.txt.value != '') {
		this.hidden = 0;
		var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
		rq.setCallback(this,'_process');
		rq.send('/jsSetNote','hashId=' + Homepage.CONF.HASHID + '&note=' + this.note + '&content=' + encodeURIComponent(this.txt.value) + '&hidden=' + 0);
	} else {
		window.alert('Musíte zadat text poznámky!')
	}

	this.parent.addButtonSetText();
};

JAK.Notes.Note.prototype._edit = function (e, elm) {
	if(typeof e != 'undefined') {
		var src = e.target || e.srcElement
		if(src.nodeName.toLowerCase() == 'a') {
			if(src.className == '') {
				return true;
			}
		}

		JAK.Events.cancelDef(e);
		JAK.Events.stopEvent(e);
	}

	if(this.hidden == 1) {
		this._open();
	}

	if (this.edited == false) {
		this._buildEdit();
		var height = this.cnt.offsetHeight
		this.cnt.style.display = "none";

		this.txt.style.height = (height < 100 ? 100 : height) + 'px';
		this.txt.value = this._tengUnescape(this.content);
		this.editCnt.style.display = "block";

		this.buttSave.style.display = 'inline';
		this.buttStorno.style.display = 'inline';
		this.buttEdit.style.display = 'none';
		this.edited = true;

		this.c.style.display = 'none';
		this.c.style.display = 'block';
	} else {
		this.buttSave.style.display = 'none';
		this.buttStorno.style.display = 'none';
		this.buttEdit.style.display = 'inline';
		this.edited = false;
		this.editCnt.style.display = "none";
		this.cnt.style.display = "block";

		this.c.style.display = 'none';
		this.c.style.display = 'block';
	}

	this.parent.addButtonSetText();
};

JAK.Notes.Note.prototype._delete = function (e, elm) {
	if(typeof e != 'undefined') {
		JAK.Events.cancelDef(e);
		JAK.Events.stopEvent(e);
	}

	if(window.confirm('Opravdu chcete tuto poznámku smazat?')) {
		var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
		rq.setCallback(this,'_process');
		rq.send('/jsRemoveNote','hashId=' + Homepage.CONF.HASHID + '&note=' + this.note);
	} else {

	}

	this.parent.addButtonSetText();
};

JAK.Notes.Note.prototype._afterSave = function (data) {
	if (this.eventsCache.writeNote) {
		JAK.Events.removeListener(this.eventsCache.writeNote);
	}
	this.content = data.note.content;
	this.parsedContent = data.note.parsedContent/*.replace(/&amp;/, '&')*/;
	this.cntTit.innerHTML = data.note.content.substring(0,30);
	this.cnt.innerHTML = this.parsedContent;
	this.filled = 1;
	this.edited = true;
	this._edit();
};

JAK.Notes.Note.prototype._afterDelete = function (data) {
	this.content = '';
	this.parsedContent = '';
	this.cntTit.innerHTML = '<a href="#" class="write-note">Napsat poznámku</a>';
	this.cnt.innerHTML = '';

	this.writeNote = JAK.DOM.getElementsByClass('write-note', this.cntTit, 'A')[0];
	this.eventsCache.writeNote = JAK.Events.addListener(this.writeNote, 'click', this, '_open', false, true);

	this.filled = 0;
	this.opened = 0;
	this.edited = false;
	this._close();
};

JAK.Notes.Note.prototype._setSelected = function (e, elm) {
	var rq = new JAK.Request(JAK.Request.TEXT, {method:"post"});
	rq.setCallback(this,'_process');
	rq.send('/jsSetSelectedNote','hashId=' + Homepage.CONF.HASHID + '&note=' + this.note);
};

JAK.Notes.Note.prototype._tengUnescape = function(content) {
	content = content.replace(/&lt;/g, '<');
	content = content.replace(/&gt;/g, '>');
	content = content.replace(/&quot;/g, '"');
	content = content.replace(/&amp;/g, '&');
	return content;
};
