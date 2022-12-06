#!/usr/bin/env python2.5
# -*- coding: utf-8 -*-
#
from mod_python import apache
from dbglog import dbg

import datetime
import json
import uuid
import urllib


def top_articles(req, user_email=None):
    """
    Top clanky
    """

    services = ["novinky", "super", "sport", "stream", "prozeny"]
    first_data_date = datetime.datetime(2014, 8, 12)

    date_arg = req.form.get.getfirst('date', str, default=None)
    try:
        date = datetime.datetime(*datetime.datetime.strptime(date_arg, "%Y-%m-%d").timetuple()[:3])
        if date >= datetime.datetime(*datetime.date.today().timetuple()[:3]):
            raise
        #endif
    except:
        date = None
    #endif

    if date is None:
        res = req.config.frog.proxy.listTopArticles(1)  # 1 - hack parametru pro fastrpcmc cachovani
    else:
        res = req.config.frog.proxy.listTopArticles(date)
    #endif
    if res['status'] / 100 != 2:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)  # NOQA
    #endif

    data = {"top_articles": {"first_data_date": first_data_date, "date": date}}

    user_email = urllib.unquote(req.form.get.getfirst("email", str, default=""))
    reg_status = req.form.get.getfirst("status", str, default="")

    if reg_status in ("ok", "email_checked", "email_already_checked", "email_already_exists", "email_deleted", "bad_captcha", "email_invalid_format") and user_email:
        data["registration"] = {
            "email": user_email,
            "status": reg_status
        }
    #endif

    articles = res.get('toparticles', [])
    if articles:
        if date is None:
            # datum neni zadano, vezmu z prvniho vysledku
            date = datetime.datetime.strptime(str(articles[0]["date"]).split("T")[0], "%Y%m%d")
            data["top_articles"]["date"] = date
        #endif

        # serazeni podle countu sestupne
        articles.sort(key=lambda x: int(x["count"]), reverse=True)

        # top10
        data["top_articles"]["articles"] = articles[:10]

        # clanky k jednotlivym sluzbam
        data["top_articles"]["services"] = []
        for service in services:
            articles_service = [a for a in articles if a["service"] == service][:3]
            if not articles_service:
                continue
            #endif
            data["top_articles"]["services"].append({"service": service,
                                                     "service_name": articles_service[0]["service_name"],
                                                     "articles": articles_service})
        #endfor
    #endif

    try:
        data["captcha_hash"], data["captcha_img"] = get_captcha(req)
    except:
        raise
    #endtry

    # root fragment pro Teng
    dataRoot = req.config.teng.createDataRoot(data)

    lib_util.generatePage(req, "top_articles.html", dataRoot, req.config.template.defaultLanguage, contentType='text/html')  # NOQA
    return apache.OK
#enddef


def top_articles_registration(req):
    """
    Top clanky - registrace emailu
    """

    email = urllib.unquote(req.form.post.getfirst('email', str, default=""))
    captcha_code = req.form.post.getfirst('captcha_code', str, default="")
    captcha_hash = req.form.post.getfirst('captcha_hash', str, default="")

    status = "ok"

    if not check_email_format(email):
        status = "email_invalid_format"
    else:
        try:
            check_captcha(req, captcha_hash, captcha_code)
        except:
            status = "bad_captcha"
        else:
            auth_code = str(uuid.uuid4()).replace('-', '')

            res = req.config.frog.proxy.topArticlesAddEmail(email, auth_code)
            if res["status"] == 404 and res.get("statusMessage").find("1062, Duplicate entry") != -1:
                dbg.log("TopArticles: duplicate entry (%s)", email, INFO=3)
                status = "email_already_exists"
            elif res["status"] != 200:
                dbg.log("TopArticles frog error: %s - %s", (req["status"], req["statusMessage"]), ERR=3)
                dbg.log(">> frog.topArticlesAddEmail(%s, %s)", (email, auth_code), ERR=3)

                return lib_util.redir(req, "/nejctenejsi-clanky")  # NOQA
            #endif
        #endtry
    #endif

    email = urllib.quote(email)
    return lib_util.redir(req, "/nejctenejsi-clanky?email=%s&status=%s%s" % (email, status, "#regform" if status != 200 else ""))  # NOQA
#enddef


def top_articles_check(req):
    """
    Top clanky - potvrzeni registrace
    """

    email = urllib.unquote(req.form.get.getfirst('email', str, default=""))
    code = req.form.get.getfirst('code', str, default="")

    if email and code:
        res = req.config.frog.proxy.topArticlesSetEmailAsChecked(email, code)
        if res['status'] != 200:
            dbg.log("TopArticles frog error: %s - %s", (req["status"], req["statusMessage"]), ERR=3)
            dbg.log(">> frog.topArticlesSetEmailAsChecked(%s, %s)", (email, code), ERR=3)

            return lib_util.redir(req, "/nejctenejsi-clanky")  # NOQA
        #endif

        status = "email_checked" if res["changed"] else "email_already_checked"

        email = urllib.quote(email)
        return lib_util.redir(req, "/nejctenejsi-clanky?email=%s&status=%s" % (email, status))  # NOQA
    #endif

    return lib_util.redir(req, "/nejctenejsi-clanky")  # NOQA
#enddef


def top_articles_delete(req):
    """
    Top clanky - odhlaseni
    """

    email = urllib.unquote(req.form.get.getfirst('email', str, default=""))
    code = req.form.get.getfirst('code', str, default="")

    if email and code:
        res = req.config.frog.proxy.topArticlesDeleteEmail(email, code)

        # Odhlasovani konci vzdy uspechem na webu
        if res['status'] != 200:
            dbg.log("TopArticles frog error: %s - %s", (req["status"], req["statusMessage"]), ERR=3)
            dbg.log(">> frog.topArticlesDeleteEmail(%s, %s)", (email, code), ERR=3)
        #endif

        email = urllib.quote(email)
        return lib_util.redir(req, "/nejctenejsi-clanky?email=%s&status=%s" % (email, "email_deleted"))  # NOQA
    #endif

    return lib_util.redir(req, "/nejctenejsi-clanky")  # NOQA
#enddef


def top_articles_captcha(req):
    """
    Top clanky - vygenerovani captchy
    """

    hash, img = get_captcha(req)

    req.content_type = "text/html"
    req.write(json.dumps({"hash": hash, "img": img}))
    return apache.OK
#enddef


def get_captcha(req):
    status, hash = httpCaptcha(req, "/captcha.create")

    if status == 200:
        return hash, "/nejctenejsi-clanky/captcha.getImage?hash=%s" % hash
    #endif

    raise Exception("CAPTCHA: can not create")
#enddef


def check_captcha(req, hash, code):
    status, _ = httpCaptcha(req, "/captcha.check?hash=%s&code=%s" % (hash, code))

    if status == 200:
        return True
    #endif

    raise Exception("CAPTCHA: not valid")
#enddef


def httpCaptcha(req, path):
    """
    Send a request to the captcha server.
    """

    url = req.config.control.captchaServer
    proxy = None

    opener = urllib.FancyURLopener({"http": proxy} if proxy else {})
    f = opener.open("%s%s" % (url, path))

    status, content = f.getcode(), None
    if status == 200:
        content = f.read()
        f.close()
    #endif

    return status, content
#enddef


def check_email_format(email):
    """
    Basic email format check
    """

    try:
        name, domain = email.split("@")
    except:
        return False
    #endtry

    try:
        tld = domain.split(".")[-1]
        return tld != "" and domain.count(".") > 0
    except:
        return False
    #endtry
#emddef

