var TopArticles = function() {
    this._topArticlesPromo  = new TopArticlesPromo(document.querySelector(".js-top-articles-promo"));
    this._topArticlesForm   = new TopArticlesForm(document.querySelector(".js-top-articles-form"));

    this._init();
};

TopArticles.prototype._init = function() {
    this._topArticlesForm.onEnter = this._saveTopArticlesPromoAsHidden.bind(this);
};

TopArticles.prototype._saveTopArticlesPromoAsHidden = function() {
    this._topArticlesPromo.saveAsHidden();
};




var TopArticlesPromo = function(elm) {
    this._dom = {};
    this._dom.container = elm;

    this._eClose = null;

    if (this._canShow()) {
        this._build();
    }
};

TopArticlesPromo.prototype.closeForever = function() {
    this.saveAsHidden();

    this._dom.container.innerHTML = "";

    if (this._eClose) {
        JAK.Events.removeListener(this._eClose);
        this._eClose = null;
    }
};

TopArticlesPromo.prototype.saveAsHidden = function() {
    window.localStorage.setItem("sznTopArticlesPromoHide", "1");
};

TopArticlesPromo.prototype._canShow = function() {
    var closedByUser = !!window.localStorage.getItem("sznTopArticlesPromoHide");
    var modalShown = document.querySelector(".js-modal-email-checked") || document.querySelector(".js-modal-email-deleted");

    return !modalShown && !closedByUser;
};

TopArticlesPromo.prototype._build = function() {
    this._dom.container.innerHTML = this._getHTMLContent();
    this._addEvents();
};

TopArticlesPromo.prototype._getHTMLContent = function() {
    var text = [
        '<div class="top-articles-promo-content">',
            'Přehled nejčtenějších článků můžete nově dostávat každé ráno na svůj e-mail. Napište nám do ',
            '<a href="#regform">pole dole</a>',
            ', kam ho chcete posílat.',
            '<span class="promo-close js-promo-close" title="Skrýt"></span>',
        '</div>'
    ];

    return text.join("");
};

TopArticlesPromo.prototype._addEvents = function() {
    var promoClose = this._dom.container.querySelector(".js-promo-close");
    this._eClose = JAK.Events.addListener(promoClose, "click", this.closeForever.bind(this));
};





var TopArticlesForm = function(elm) {
    this.onEnter = null;

    this._dom = {};
    this._dom.container = elm;

    this._submitted = false;

    this._init();
};

TopArticlesForm.prototype._init = function() {
    this._dom.form              = this._dom.container.querySelector(".js-form");
    this._dom.emailInput        = this._dom.form.querySelector(".js-email");
    this._dom.refreshCaptchaBtn = this._dom.form.querySelector(".js-refresh-code-btn");
    this._dom.captchaContent    = this._dom.form.querySelector(".js-captcha-content");
    this._dom.captchaHash       = this._dom.captchaContent.querySelector(".js-captcha-hash");
    this._dom.captchaImage      = this._dom.captchaContent.querySelector(".js-captcha-image");

    JAK.Events.addListener(this._dom.refreshCaptchaBtn, "mousedown", this._refreshCaptchaCode.bind(this));
    JAK.Events.addListener(this._dom.emailInput, "focus", this._processInputFocus.bind(this));
};

TopArticlesForm.prototype._processInputFocus = function() {
    if (this._dom.captchaContent.classList.contains("hidden")) {
        this._dom.captchaHash.value = "";
        this._dom.captchaImage.src = "";
        this._refreshCaptchaCode().then(this._showCaptcha.bind(this));
    }

    if (this.onEnter) { this.onEnter(); }
};

TopArticlesForm.prototype._refreshCaptchaCode = function() {
    var request = new JAK.Request(JAK.Request.TEXT);

    var sentRequest = request.send("/nejctenejsi-clanky/get-captcha");
        sentRequest.then(this._refreshCaptchaCodeResponse.bind(this));

    return sentRequest;
};

TopArticlesForm.prototype._refreshCaptchaCodeResponse = function(response) {
    var data = null;

    try {
        var data = JSON.parse(response.data);

        if (!data.hash || !data.img) {
            alert("Momentálně se nám něco nedaří. Zkuste to později.");
            return;
        }
    } catch(e) {
        alert("Momentálně se nám něco nedaří. Zkuste to později.");
        return;
    }

    this._dom.captchaHash.value = data.hash;
    this._dom.captchaImage.src = data.img;
};

TopArticlesForm.prototype._showCaptcha = function() {
    this._dom.captchaContent.classList.remove("hidden");
};
