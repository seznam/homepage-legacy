/* Poznamky */
JAK.Notes = JAK.ClassMaker.makeClass({
	NAME:"Notes",
	VERSION:"1.0"
});

JAK.Notes.prototype.$constructor = function (parent,feedId) {
	/* odriznem nepodporovane browery */
	if (JAK.isSupported == false) {
		return;
	}

	this.feedId = feedId;
	this.parent = parent;
	this.htmlObject = JAK.gel(parent);
	this.eventsCache = new Object();

	this.answer = null;
	this.notesElm = JAK.gel('notes');

};

JAK.Notes.prototype.$destructor = function () {
	for (i in this.eventsCache) {
		JAK.Events.removeListener(this.eventsCache[i]);
	}
};

JAK.Notes.prototype.setNotes = function (notes) {
	this.notes = new Array();
	for(var n = 0; n < notes.length; n++) {
		this.notes[this.notes.length] = new JAK.Notes.Note(this, notes[n].note, notes[n].content, notes[n].parsedContent, notes[n].selected, notes[n].filled, notes[n].hidden);
	};

	this._addButtonBuild();
};

JAK.Notes.prototype._addButtonBuild = function () {
	this.addButtonCnt = JAK.cel('DIV');
	this.addButtonCnt.className = 'item add-note-box';

	this.addButtonCnt.innerHTML = '<span class="new-note"><a href="#">Nová poznámka</a></span>';

	this.notesElm.appendChild(this.addButtonCnt);
	this.addButton = this.addButtonCnt.getElementsByTagName('A')[0];
	this.eventsCache.addButton = JAK.Events.addListener(this.addButton, "click", this, "_addNote", false, true);
};

JAK.Notes.prototype._addNote = function (e, elm) {
	JAK.Events.cancelDef(e);
	for(var i = 0; i < this.notes.length; i++) {
		if(this.notes[i].filled == 0) {
			if(this.notes[i].edited == true) {
				this.notes[i]._save();
			} else {
				this.notes[i]._edit();
				this.addButton.innerHTML = 'Uložit novou poznámku';
			}
			break;
		}
		if(i == this.notes.length-1) {
			alert('Již máte použity všechny poznámky!');
		}
	}
};

JAK.Notes.prototype.addButtonSetText = function () {
	this.addButton.innerHTML = 'Nová poznámka';
};
