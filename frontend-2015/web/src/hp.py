#!/usr/bin/env python2.5
# -*- coding: utf-8 -*-
#
# FILE          $Id$
#
# DESCRIPTION   Homepage
#
# import
from mod_python import apache
from dbglog     import dbg
from copy       import deepcopy

import json
import pickle, base64

import ConfigParser
import re
import fastrpc
import random
import urllib
import types
import mx.DateTime
import redirect
import datetime
from skin import addSkinsContent, addSkinCustom, addSkinSelected
from hint import addHintContent

# Google App Rating
import lib.googlerating as grr


def _jsafe(data):
    return data.replace("'", "\\'").replace("\n", " ")
#enddef


def _cnv(data, encoding, errors = "strict"):
    """Tato metoda provede konverzi na zadany charset
    (predpoklada se vstup v unicoce nebo utf-8
    """
    if type(data) == types.StringType:
        data = unicode(data, 'utf-8').encode(encoding, errors)
    elif type(data) == types.UnicodeType:
        data = data.encode(encoding, errors)
    #endif

    return data
#enddef


def _generateRSSContent(req, templateName, ctype, checkHid, forceFeed = None):
    """Uzivatelske RSS
    """

    # zakladni informace o uzivateli
    dataRoot = req.userInfo.createDataRoot()
    dataRoot.addVariable("feedListBaseUrl", req.config.feeds.feedListBaseUrl)

    # mame jiny vystupni charset?
    charset = req.form.get.getfirst('charset', str, default = '')
    if charset in ['cp1250', 'windows-1250']:
        encoding = 'cp1250'
        outCharset = 'windows-1250'
    else:
        encoding = 'utf-8'
        outCharset = 'utf-8'
    #endif

    if checkHid:
        hid = req.form.get.getfirst('hid', default='')
        if req.userInfo.loggedUser:
            try:
                req.userInfo.verifyHashId(hid)
            except ValueError:
                dbg.log('Hash hid=%s does not match for user userId=%d', (hid, req.userInfo.userId), WARN=3)
                # zakazeme zobrazovani uzivatelovych feedu, protoze neni autentizovan
                req.userInfo.loggedUser = False
                raise
            #endtry
        #endif
    #endif

    try:
        # ziskame seznam RSS zdroju uzivatele
        rssList = []
        maxItemsMap = {}

        if forceFeed:
            rssList.extend(forceFeed['rssList'])
            maxItemsMap.update(forceFeed['maxItemsMap'])
            dataRoot.addVariable('updateOnly', 1)
        else:
            dataRoot.addVariable('updateOnly', 0)
            userFeedList = req.userInfo.listFeeds()
            for f in userFeedList:
                feedId = f['feedId']
                if req.config.feeds.zodiacMapping[0].get(feedId, '') or \
                   req.config.feeds.weatherMapping[0].get(feedId, ''):
                    continue
                #endif

                rssList.append(feedId)
                maxItemsMap[feedId] = f['rowCount']
            #endfor

            if not len(rssList) and not req.userInfo.loggedUser:
                rssList.extend(req.config.feeds.newUserFeeds)
            #endif
        #endif

        # holder for seen group ids
        seenGroupId = {}

        #
        # vytahneme obsah vsech RSS zdroju
        #
        if len(rssList):
            res = req.config.frog.proxy.feed.getContentList(rssList,
                    req.config.feeds.outageUrl)
            if res['status'] / 100 != 2:
                raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
            #endif

            # ze seznamu zdroju sestavime Teng fragmenty
            for feed in res.get('feeds', ()):

                # nastavime pocitadlo maxItems. Pokud nevim, kolik jich
                # je, pouzijeme -1, coz je zamer = pocitadlo jde do minusu
                # a pouziji se tak vsechny items (testuje se maxItems > 0)
                feed['maxItems'] = maxItemsMap.get(feed['feedId'], 6)

                # prekodovani
                if encoding != 'utf-8':
                    feed['title'] = _jsafe(_cnv(feed['title'], encoding))

                    for item in feed['items']:
                        item['title'] = _jsafe(_cnv(item['title'], encoding))
                        if not item.get('link', '').startswith('http://'):
                            item['link'] = ''
                        else:
                            item['link'] = _jsafe(item['link'])
                        #endif
                    #endfor
                else:
                    feed['title'] = _jsafe(feed['title'])

                    for item in feed['items']:
                        item['title'] = _jsafe(item['title'])
                        if not item.get('link', '').startswith('http://'):
                            item['link'] = ''
                        else:
                            item['link'] = _jsafe(item['link'])
                        #endif
                    #endfor
                #endif

                # potrebne konverze
                feed['lastUpdate'] = feed['lastUpdate'].unixTime
                feed['allowHtml'] = int(feed['allowHtml'])
                feed['allowImage'] = int(feed['allowImage'])

                # zabraneni JS v kodu
                if not feed['serverUrl'].startswith('http://'):
                    feed['serverUrl'] = ''
                else:
                    feed['serverUrl'] = _jsafe(feed['serverUrl'])
                #endif

                x = dataRoot.addFragment("feed_%s" % feed['typeId'], feed)

                # send groupId as advertGroup if not yet seen
                groupId = feed.get("groupId")
                if groupId and feed['typeId'] == 'rss' and not seenGroupId.has_key(groupId):
                    seenGroupId[groupId] = 1
                    x.addVariable("advertGroup", groupId)
                #endif
            #endfor
        #endif

    except (fastrpc.Fault, fastrpc.Error), e:
        dbg.log('Ignoring FastRPC error: %s', str(e), WARN = 3)
    #except:
        dbg.log('Ignoring unknown error', WARN = 3)
    #endif


    # generuj stranku
    lib_util.generatePage(req, templateName, dataRoot, req.userInfo.language,
                    contentType = 'text/html',
                    responseContentType = '%s; charset=%s' % (ctype, outCharset),
                    encoding = encoding)

    return apache.OK
#enddef


def indexScreenCore(req, dataRoot, generateSorryPage = False, json = False):
    """
    Pomocna funkce pro generovani obsahu stranky.
    """

    if not json:
        if req.userInfo.loggedUser:
            dataRoot.addVariable("prefill", not req.userInfo.temporary)
            dataRoot.addVariable("lide_hashId", lib_util.lide_idToHash(req.userInfo.userId))
        else:
            dataRoot.addVariable("prefill", False)
            dataRoot.addVariable("lide_hashId", "")
        #endif

        # pridame seznam domen pro prihlasovani
        for d in req.config.control.availableDomains:
            dataRoot.addFragment('domainList', { 'domain' : d })
        #endfor

        # zjistime IP adresu prihlaseneho uzivatele
        dataRoot.addVariable("clientIP", req.userInfo.inetInfo.remoteIp)

        # add Tv Channel list
        if req.userInfo.loggedUser:
            try:
                addTVChannelList(req, dataRoot)
            except:
                pass
        #endif
    #endif

    addSkinsContent(req, dataRoot)
    req.userInfo.synchSkins(req)
    req.userInfo.synchWeather(req)
    req.userInfo.synchZodiac(req)
    req.userInfo.synchFeeds(req)
    addSkinCustom(req, dataRoot)
    addSkinSelected(req, dataRoot)

    if generateSorryPage:
        dbg.log("Generating sorry page from %s",
            req.userInfo.inetInfo.remoteIp, INFO = 1)
        param = req.form.get.getfirst("region", default = "0")
        req.userInfo.weather_autodetect()
    else:
        dbg.log("Serving page to %s",
            req.userInfo.inetInfo.remoteIp, INFO = 1)
        # do tengu pridame hinty
        addHintContent(req, dataRoot)
    #endif

    region = req.config.feeds.weatherMapping[0].get(
        req.userInfo.weatherFeedId, "")

    # do tengu pridame regiony pro pocasi
    for k, v in lib_uiradr.countyCodes.iteritems():
        countySelected = region in v["districts"]
        countyFragment = {
            "id"       : k,
            "name"     : v["name"],
            "selected" : countySelected
        }

        if countySelected:
            # pridame seznam mest pro zvoleny region
            countyFragment["district"] = tuple({
                "id"       : district,
                "name"     : lib_uiradr.district[district][0],
                # mesto neni vybrano pokud bylo pouzito GeoIP
                "selected" : region == district,
                        # and (not req.userInfo.weatherByGeoIP and region == district)
            } for district in v["districts"])
        #endif

        dataRoot.addFragment('county', countyFragment)
    #endif

    # do tengu pridame horoskopy
    for key, value in req.config.feeds.zodiacMapping[0].iteritems():
        dataRoot.addFragment('zodiac', {
            'name'     : value,
            'id'       : key,
            'selected' : key == req.userInfo.zodiacFeedId
        })
    #endfor

    # do tengu pridame tip - docasne vypnuto, protoze tip ma svuj vlastni feed
    # addTipContent(req, dataRoot, remoteIp)

    # do tengu pridame rss feedy
    addRssContent(req, dataRoot)

    # do tengu pridame hledaci listu
    addSearchContent(req, dataRoot)

    # do tengu pridame kalendar
    addCalendarContent(req, dataRoot)

    # do tengu pridame facebook
    addFacebookContent(req, dataRoot)

    # pridani titulku, treti parametr je lokace,
    # pro kterou je titulek urcen, default 0
    locality = 0
    if generateSorryPage:
        param = req.form.get.getfirst("region", default = "0")
        try:
            region = int(param)
            if region in lib_geoip.feedIdRegionMap:
                locality = region
            #endif
        except:
            locality = 0
        #endtry
    else:
        locality = req.userInfo.geoIpRegion
    #endif
    addTitleContent(req, dataRoot, locality)

    # info o prihlaseni
    if req.userInfo.last_login:
        dbg.log("Serving user customized page to %s",
            req.userInfo.inetInfo.remoteIp, INFO = 1)
        dataRoot.addVariable('logged', 1)
    else:
        dbg.log("Serving default page to %s",
            req.userInfo.inetInfo.remoteIp, INFO = 1)
        dataRoot.addVariable('logged', 0)
    #endif

    # Google App Rating
    for r in grr.GoogleRating(req).get():
        dataRoot.addFragment("google_rating", r)
    #endfor

    # Odkaz na zapnuti bety
    beta_sw = lib_util.get_dbconfig_switch(req, "beta_switch", "BETA_2015_SWITCH", ttc=15)
    dataRoot.addVariable("beta_switch", beta_sw)

    beta_auto_sw = lib_util.get_dbconfig_switch(req, "beta_auto_switch", "BETA_2015_AUTO_SWITCH", ttc=10)
    dataRoot.addVariable("beta_auto_switch", beta_auto_sw)
#enddef


def jsGetContent(req):
    """
    Vygeneruje obsah stranky pro JavaScript
    """

    # az ted overime uzivatele;
    # pokud overeni selze na nedostupnost nektere
    # z komponent, vratime sorry homepage
    lib_userinfo.UserInfo(req, checkHashId = False)

    # root fragment pro Teng
    dataRoot = req.userInfo.createDataRoot()
    try:
        # data do root fragmentu
        indexScreenCore(req, dataRoot, json = True)
    except:
        dataRoot.addFragment("result", {
            "status" : 500,
            "statusMessage" : "internal_error"
        })
    else:
        dataRoot.addFragment("result", {
            "status" : 200,
            "statusMessage" : "ok"
        })
    #endtry

    # generuj stranku
    lib_util.generatePage(
        req,
        "js_getContent.js",
        dataRoot,
        req.config.template.defaultLanguage,
        contentType = "text/html",
        responseContentType = "application/x-javascript; charset=utf-8"
    )

    # vrat apache.OK :)
    return apache.OK
#enddef

def setup(req):
    # root fragment pro Teng
    dataRoot = req.userInfo.createDataRoot()
    dataRoot.addVariable('lide_hashId', lib_util.lide_idToHash(req.userInfo.userId))

    rss_url = req.form.get.getfirst('rss_url', str, default = '')
    if rss_url:
        rss_title = req.form.get.getfirst('rss_title', str, default = '')
        dataRoot.addVariable('rss_url', rss_url)
        dataRoot.addVariable('rss_title', rss_title)
    #endif

    req.userInfo.weatherFeedId = 99
    addRssContent(req, dataRoot, setupPage = True)
    addSearchContent(req, dataRoot)
    lib_util.generatePage(req, 'setup.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def distribuce(req):
    """
    Handler pro sbrowser ???
    /distribuce.html - prazdna prihlasena stranka
    """

    try:
        lib_userinfo.UserInfo(req, checkHashId=False)  # NOQA
    except:
        # pust vyjimku dal, at ji zpracuje nejaky handler
        #raise
        return apache.HTTP_INTERNAL_SERVER_ERROR
    #endtry

    return apache.OK
#enddef


def indexScreen(req):
    """Zobrazi Homepage
    """

    # obnovena podpora pre redirekty /?goto=dest
    goto = req.form.get.getfirst('goto', str, default = '')
    if goto:
        return lib_util.logged_jump(req, goto, req.form.get, '')
    #endif

    clientId = req.form.get.getfirst("clid", int, default = "")
    if clientId:
        dbg.log("Parameter clientid: %s", clientId, INFO = 2)
        try:
            lib_util.setClientIdCookie(req, clientId)
        except Exception, e:
            dbg.log("Exc: %s", e, ERR = 2)
        #endtry
        return lib_util.redir(req, "/")
    #endif

    # over, zda nemame generovat sorry page
    generateSorryPage = req.form.get.getfirst('generateSorryPage', default = '')

    # uzavreme generovani Homepage do try blocku. Defaultne pri zobrazeni nechame
    # vyjimku vybublat ven, aby ji zpracoval nejaky handler. Pouze pri pozadavku
    # na generovani sorry page chyby reportujeme klientovi
    try:
        if not generateSorryPage and req.config.control.sorryPage:
            raise Exception("Only sorry page")
        #endif

        # az ted overime uzivatele; pokud overeni selze na nedostupnost
        # nektere z komponent, vratime sorry homepage
        lib_userinfo.UserInfo(req, checkHashId = False)
        #if not req.userInfo.userId:
        #    # NB: Jiz probehlo v UserInfo (navic objekt se neuklada).
        #    lib_anonyminfo.AnonymInfo(req, checkHashId = False)
        #endif

        # root fragment pro Teng
        dataRoot = req.userInfo.createDataRoot()

        # data do root fragmentu
        indexScreenCore(req, dataRoot, generateSorryPage)
    except:
        # pokud mame generovat sorry page
        # skonci zpracovani serveru 500kou
        # jinak vyjimku pustime dal
        if generateSorryPage:
            req.config.edbg.log("Error generate sorry page: %s",
                lib_error.getExceptionString(), ERR = 4)
            dbg.log("Error generate sorry page: %s",
                lib_error.getExceptionString(), ERR = 4)
            return apache.HTTP_INTERNAL_SERVER_ERROR
        #endif

        # pust vyjimku dal, at ji zpracuje nejaky handler
        raise
    #endtry

    # vygenerujeme Homepage
    if generateSorryPage:
        lib_util.generatePage(req, 'index.html', dataRoot,
            req.userInfo.language, contentType = 'text/html', sanitizeTeng = True)
    else:
        lib_util.generatePage(req, 'index.html', dataRoot,
            req.userInfo.language, contentType = 'text/html')
    #endif

    return apache.OK
#enddef


def addCalendarContent(req, dataRoot):
    """Prihozeni kalendare
    """
    cal = lib_calendar.Calendar()
    dat = mx.DateTime.now()
    day = deepcopy(cal.getDay(dat.day, dat.month))
    day["url"] = "http://www.stream.%s/dnesni-svatek" % req.config.control.UrlTld
    try:
        res = req.config.frog.proxy.holiday.getAttributes(dat.Format("%Y-%m-%d"))
        if res['status'] == 200:
            day["holiday"] = res["holidayAttributes"]["name"]
            day["url"] = res["holidayAttributes"]["url"]
    except:
        pass
    #endtry

    try:
        # olinkovani jmen
        if req.config.control.nameInterpretUrl is None:
            raise Exception("No NameInterpretUrl setting in config.")
        #endif

        res = req.config.horoscope.proxy.nameinterpretation.getDataForHP(dat.day, dat.month, ("id", "name", "url", "day", "month"))
        if res['status'] == 200:
            templ = '<a href="%s/%%s#hp_seznam" title="Význam jména %%s" class="name-link">%%s</a>%%s' % req.config.control.nameInterpretUrl
            names = [{"name": n["name"].encode("utf8"), "url": n["url"]} for n in res.get("data", [])]

            for n in names:
                url = n["url"]
                day["name"] = re.sub("(%s)(,|\s|$)" % n["name"], lambda x: templ % (url, x.group(1), x.group(1), x.group(2)), day["name"])
            #endfor
        #endif
    except Exception, e:
        dbg.log("Error during linking first name(s): %s", str(repr(e)), WARN=4)
    #endtry

    dataRoot.addFragment('calendar', day)
#enddef


def addTipContent(req, dataRoot, remoteIp):
    """
    Vytvoreni fragmentu pro tip
    """

    # ignorujeme veskere problemy, ktere nastanou s tip core
    try:
        res = req.config.tip.proxy.sleva.getHPBox()
        if res['status'] == 200:
            dataRoot.addFragment('tip', res['box']['tip'])
        else:
            lib_error.UnexpectedResponse(req.config.tip.proxy, res)
        #endif

        # get city from cookie
        #city = lib_util.getTipCityCookie(req)
        #if not city:
        #    res = req.config.tip.proxy.sleva.getCity(req.userInfo.userId, remoteIp)
        #    if res["status"]/100 != 2:
        #        lib_error.UnexpectedResponse(req.config.tip.proxy, res)
        #    #endif
        #    c:ity = res["city"]
        #
        #    # cook the city
        #    lib_util.setTipCityCookie(req, str(city))
        #endif
        #res = req.config.tip.proxy.sleva.getHP(int(city))
        #if res["status"]/100 == 2:
        #    dataRoot.addVariable("tip", res["link"])
        #else:
        #    lib_error.UnexpectedResponse(req.config.tip.proxy, res)
        #endif
    except:#Exception, e:
        pass
    #endtry
#enddef

def addTVContent(req, dataRoot):
    """Prihozeni tv programu
    """
    tvFragment = dataRoot.addFragment('feed_tv', {})
    now = mx.DateTime.now().Format("%Y-%m-%d %H:%M:00")
    generateTvProgram(req, tvFragment, now, now, 0, 0, 'utf-8')
#enddef

def addTVChannelList(req, dataRoot):
    res = req.config.tvServer.proxy.listChannels()
    if res['status'] == 200:
        tvgroup = {}
        for c in res["channels"]:
            tv = {}

            tv["selected"] = 0
            if c["id"] in req.userInfo.tvChannelId:
                tv["selected"] = 1
            #endif

            tv["id"] = c["id"]
            tv["name"] = c["name"]

            # reorder channels based on type
            for g in c["types"]:
                if tvgroup.has_key(g["id"]) and tvgroup[g["id"]].has_key("tv"):
                    type_list = tvgroup[g["id"]]["tv"]
                else:
                    type_list = ()

                tvgroup[g["id"]] = {
                    "id":g["id"],
                    "name":g["name"],
                    "tv":type_list + (tv,)
                }

        # convert tvgroup dict to array
        for v in tvgroup.itervalues():
            dataRoot.addFragment('tvgroup', v)
#enddef


def addNoteContent(req, dataRoot):
    """Prihozeni poznamek
    """
    items = []
    notes = req.userInfo.getNotes()
    for note in notes:
        items.append({"note"          : note["noteNumber"],
                      "content"       : note["noteAbstract"],
                      "parsedContent" : lib_util.parseNote(req, note["noteAbstract"]),
                      "hidden"        : int(note["hidden"].value)})
    #endfor
    dataRoot.addFragment("notes", {"item" : items})
#enddef


def addFacebookContent(req, dataRoot):
    """Prihozeni poznamek
    """
    if not req.userInfo.loggedUser:
        return

    facebook = req.userInfo.getFacebookAttributes()
    dataRoot.addFragment("facebook", facebook)
#enddef


def addGadgetContent(req, dataRoot, feedId = 0):
    """
    add data related to gadget with feedId to dataRoot
    """

    #feedList = req.userInfo.listFeeds()
    feedList = [{'column': 0, 'rowCount': 5, 'feedId': feedId, 'row': 0, 'showPreview': 0}]

    # vezmu si vsechny idecka feedu, pro ktere mam vytahnout informace
    #fixme: add forceFeedId 
    feedIds = [item["feedId"] for item in feedList]

    # seznam pouzitch feedu
    dbg.log("Get info for feeds: %s", (feedIds), INFO = 1)

    # a vytahnu informace o jednotlivych feedech
    res = req.config.frog.proxy.feed.getContentList(feedIds,
            req.config.feeds.outageUrl)

    if res['status'] / 100 != 2:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
    #endif

    # vytazene feedy si dam do mapy abych je mohl umistovat
    # na spravna mista podle serazenych feedList
    feedMap = {}
    for feed in res["feeds"] :
        feedMap[feed["feedId"]] = feed
    #endfor
    dbg.log("Got feed id `%s'.", (feedMap), INFO = 1)

    # hlavni fragment rss feedu
    rssColumnFrag = dataRoot.addFragment("columns", {})

    columns = req.userInfo.columns

    column = 0

    # ze seznamu zdroju sestavime Teng fragmenty
    for feed in feedList :
        dbg.log("Got feed id `%s'.", (feed['feedId']), INFO = 1)

        # avoid XSS
        if not feedMap[feed["feedId"]]["serverUrl"].startswith('http://'):
            feedMap[feed["feedId"]]["serverUrl"] = ''
        #endif

        for item in feedMap[feed["feedId"]]["items"]:
            if not item.get('link', '').startswith('http://'):
                item['link'] = ''
            #endif
        #endfor

        # data a potrebne konverze
        feed["allowHtml"] = int(feedMap[feed["feedId"]]["allowHtml"])
        feed["allowImage"] = int(feedMap[feed["feedId"]]["allowImage"])

        # titulek pro pocasi
        feed["title"] = feedMap[feed["feedId"]]["title"]
        #endif
        feed["url"] = feedMap[feed["feedId"]]["url"]
        feed["typeId"] = feedMap[feed["feedId"]]["typeId"]
        if feedMap[feed["feedId"]].has_key("emailId"):
            feed["emailId"] = feedMap[feed["feedId"]]["emailId"]
        #endif

        feed["items"] = []
        for item in feedMap[feed["feedId"]]["items"]:
            try :
                # pocet radku ve feedu pro prihlaseneho uzivatele
                item["rowCount"] = feed["rowCount"]
                item["feedId"] = feed["feedId"]
                item["showPreview"] = 0
            except :
                # pocet radku ve feedu pro neprihlaseneho uzivatele
                # z konfiguraku
                pass
            #endtry

            feed["items"].append(item)
        #endfor

        feed["serverUrl"] = feedMap[feed["feedId"]]["serverUrl"]
        feed["lastUpdate"] = feedMap[feed["feedId"]]["lastUpdate"]


        while column != feed["column"]:
            rssColumnFrag = dataRoot.addFragment("columns", {})
            column += 1
        #endwhile

        feedFrag = rssColumnFrag.addFragment("feed", feed)


        # FIXME: check feed group (uncomment following line
        #        and remove the line after it)
        # if feed["groupId"] == "foreignemail" and feed.has_key("emailId"):
        if feed.has_key("emailId"):
            addForeignEmailContent(req, feedFrag, feed)
        #endif

    #endfor

    while column < columns - 1:
        column += 1
        dataRoot.addFragment("columns", {})
    #endwhile

#enddef


def jsAddGadget(req, feedId=0):
    """
    add gadget on HP for given feed
    """
    dataRoot = req.userInfo.createDataRoot()

    #need to save newly added feed

    feedAttributes = {
        "feedId": feedId,
        "column": 0,
        "showPreview": fastrpc.Boolean(0),
        "rowCount": 5
    }

    try:
        res = req.config.frog.proxy.user.feed.add(req.userInfo.userId, feedAttributes)
        if res['status'] / 100 != 2:
            return apache.HTTP_INTERNAL_SERVER_ERROR
    except:
        return apache.HTTP_INTERNAL_SERVER_ERROR

    dataRoot.addFragment("result", {"status": res['status'],
                                    "statusMessage": res['statusMessage']})

    #adding feed content as a gadget
    addGadgetContent(req, dataRoot, feedId)

    lib_util.generatePage(req, 'js_feed_add.js', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def addForeignEmailContent(req, dataRoot, feed):
    """Vytahne zpravy pro dany email
    a prida je do data rootu
    """

    emailId = feed["emailId"]

    emailSettings, messageList = req.userInfo.listEmails(emailId)
    for message in messageList:
        # FIXME: remove all lines between this comment and
        #        line containing dataRoot.addFragment("items", message)
        message["rowCount"] = feed["rowCount"]
        message["feedId"] = feed["feedId"]
        message["sentDate"] = message["sentDate"].unixTime
        dataRoot.addFragment("items", message)
    #endfor
    if emailSettings.has_key('lastUpdate'):
        dataRoot.addVariable("lastUpdate", emailSettings["lastUpdate"].unixTime)
        emailSettings.pop("lastUpdate")
    for key, value in emailSettings.iteritems():
        dataRoot.addVariable(key, value)
    #endfor
#enddef

def addGasContent(req, dataRoot):
    """Pridame ceny PHM
    """

    items = None
    #FIXME: id of the feed2config
    defaultGasFeed = req.config.rates.defaultGasFeed
    try:
        items = req.config.feeds.cached[defaultGasFeed]["items"]
    except:
        res = req.config.frog.proxy.feed.getContentList((defaultGasFeed,),
                req.config.feeds.outageUrl)
        if res["status"] / 100 == 2:
            items = res["feeds"][0]["items"]
        #endif
    #endtry

    if items:
        userRegionGasId = int(req.userInfo.regionGasId)
        for item in items:
            # vyber dle regionu
            if int(item["id"]) == userRegionGasId:
                dataRoot.addFragment("items", item)
            #endif
        #endif
    #endif
#enddef

def ensureUserColumns(userInfo, feedList):
    """
    """
    if userInfo.columns == 3:
        return
    #endif

    for feed in feedList:
        if feed["column"] == 2:
            userInfo.columns = 3
            break
        #endif
    #endfor
    return
#enddef

def addRssContent(req, dataRoot, setupPage = False):
    """
    Vytahneme obsah vsech RSS zdroju a prida je do data rootu. Parametr setupPage
    zabrani resolvovani id gadgetu pro horoskop a pocasi na konketni id feedu.
    """

    # dotahneme vsechny RSS zdroje uzivatele
    feedList = req.userInfo.listFeeds()

    # NB: docasne reseni problemu nekonzistence dat v DB.
    # Existuji uzivatele, ktere maji pocet sloupcu nastaveno
    # na hodnotu 2 ale feedy jsou pozicovane na 3 sloupce.
    ensureUserColumns(req.userInfo, feedList)

    # vytvoreni fragmentu pro jednotlive sloupce
    columnsDataRoot = dict((i, dataRoot.addFragment("columns", {})) \
        for i in xrange(req.userInfo.columns))

    # upravim poradi/parametry feedu dle pouzite varianty
    #if (req.userInfo.skin == 0 and req.userInfo.variation <> ""
    #  and lib_util.feed_cmp(feedListStatic, feedList) == 0
    #):
    #    patchFeeds(req, feedList)
    #endif

    if setupPage:
        # Pro vygenerovani setup page nejsou zapotrebi data
        # k feedum -- pouze idecka danych feedu.
        for feed in feedList:
            # zvolime fragment sloupce pro dany feed
            feedColumnFrag = columnsDataRoot[feed["column"]]
            feedColumnFrag.addFragment("feed", feed)
        #endfor
        return
    #endif

    # Upravim feed horoskopu
    prepareZodiac(req, feedList)
    # Upravim feed pocasi
    prepareWeather(req, feedList)

    dbg.log("Get info for feedList: %s",
        (tuple(feed["feedId"] for feed in feedList),), INFO = 1)

    # req.config.frog je pouzit pro dotazeni dat k feedum, ktere nejsou v cache
    for feed in req.config.feeds.cached.dataFactory(feedList,
            req.config.frog, req.config.feeds.outageUrl
    ):
        # mnozina feedu je usporadana dle umisteni

        feedId = feed["feedId"]
        feedIsOutage = feed["isOutage"] if "isOutage" in feed else False

        #dbg.log("Got feed id `%s'.", feedId, INFO = 1)

        if feedId == req.config.rates.defaultCurrencyFeed:
            # default currencies:
            if not req.userInfo.currencyId:
                #FIXME:2config
                req.userInfo.currencyId = req.config.rates.defaultCurrencies
            #endeif

            # filter out items for user currency
            available_currencies = req.config.frog.proxy.listCurrencies()
            if available_currencies["status"] / 100 != 2:
                continue
            else:
                userCurrencyId = req.userInfo.currencyId
                currencyId = available_currencies["currencyId"]
                currencyCodes = dict((c["name"], c["id"]) \
                        for c in currencyId if c["id"] in userCurrencyId)
            #endif

            filteredItems = [item for item in feed["items"] \
                    if item["title"] in currencyCodes]

            if filteredItems:
                feed["items"] = filteredItems
            #endif

            dbg.log("Changed currency list: %s",
                (tuple(item["title"] for item in feed["items"]),), INFO = 1)
        #endif

        # avoid XSS
        if not feed["serverUrl"].startswith("http://") and not feed["serverUrl"].startswith("https://") and not feedIsOutage:
            feed["serverUrl"] = ""
        #endif

        feedTengData = {
            "feedId"      : feedId,
            "rowCount"    : feed["rowCount"],
            "favicon_url" : feed["faviconUrl"],
            "showPreview" : feed["showPreview"] if "showPreview" in feed else 0,
            "isOutage"    : feedIsOutage,
            "title"       : feed["title"],
            "url"         : feed["url"],
            "typeId"      : feed["typeId"],
            "serverUrl"   : feed["serverUrl"],
            # data a potrebne konverze
            "allowHtml"   : int(feed["allowHtml"]),
            "allowImage"  : int(feed["allowImage"]),
            # titulek pro feed
            "title"       : feed["title"],
        }

        # data pro pocasi
        weatherFeedId = -1
        if "weatherFeedId" in feed:
            items_cnt = len(feed["items"])

            if items_cnt > 3:
                try:
                    feed["items"] = prepareWeatherItems(req, feed["weatherFeedId"], feed["items"][3:])
                except Exception, e:
                    dbg.log("Weather Box: Error when setting values: %s", str(repr(e)), ERR=4)
                    feed["items"] = feed["items"][:3]
                    items_cnt = len(feed["items"])
                #endtry
            #endif

            if items_cnt <= 3:
                # zpetna kompatibilita
                i = 0
                for item in feed["items"]:
                    item["seznam_weatherItemType"] = ("today", "tomorrow", "day_after_tomorrow")[i]
                    i += 1
                #endfor
            #endif

            weatherFeedId = feed["weatherFeedId"]
            district = req.config.feeds.weatherMapping[0][weatherFeedId]
            feedTengData["weatherAllowHtml"] = feed["weatherAllowHtml"]
            feedTengData["weatherAllowImage"] = feed["weatherAllowImage"]
            feedTengData["weatherFeedId"] = feed["weatherFeedId"]
            feedTengData["weatherLastUpdate"] = feed["weatherLastUpdate"]
            feedTengData["weatherServerUrl"] = feed["weatherServerUrl"]
            feedTengData["weatherTitle"] = lib_uiradr.district[district][0]
            feedTengData["weatherTypeId"] = feed["weatherTypeId"]
            feedTengData["weatherUrl"] = feed["weatherUrl"]
            feedTengData["weatherByGeoIP"] = req.userInfo.weatherByGeoIP
            feedTengData["weatherFailedGeoIP"] = req.userInfo.weatherFailedGeoIP
            feedTengData["weatherCrPlaces"] = {
                1   : "top"            , # Cela CR
                2   : "stredocesky"    , 27  : "stredocesky"    ,
                35  : "jihocesky"      , 43  : "plzensky"       ,
                51  : "karlovarsky"    , 60  : "ustecky"        ,
                78  : "liberecky"      , 86  : "kralovehradecky",
                94  : "pardubicky"     , 108 : "vysocina"       ,
                116 : "jihomoravsky"   , 124 : "olomoucky"      ,
                132 : "moravskoslezsky", 141 : "zlinsky"        ,
            }.get(lib_uiradr.district[district][1], "top")
        #endif

        if feedId == 182:
            # Box Firmy.cz
            dbg.log("FEED = %s", str(feed), DBG=1)
            for item in feed["items"]:
                item["links"] = pickle.loads(base64.decodestring(item["links"]))
            #endfor
        #endif

        if feedId == 26:
            # Novinky - Volebni special 2013
            try:
                election = NewsElection(req).get_data()
                if election is not None:
                    feedTengData["election"] = election
                #endif
            except Exception, e:
                dbg.log("Election Special Error: %s", str(repr(e)), WARN=4)
            #endtry

            # Audionovinky - presunout item na posledni viditelne misto
            try:
                items = feed.get('items', [])
                afIndexes = [index for index, item in enumerate(items)
                    if (item.get('seznam_audionews128m') or item.get('seznam_audionews96m') or item.get('seznam_audionews64m'))]
                # pokud existuje audionovinka a pocet zobrazenych radku je vice nez 1, presuneme prvni nalezenou (s vice se nepocita)
                if afIndexes and feed["rowCount"] > 1:
                    items.insert(feed["rowCount"] - 1, items.pop(afIndexes[0]))
                #endif
            except Exception, e:
                dbg.log("AudioNews reorder error: %s", str(repr(e)), WARN=4)
            #endtry
                
        #endif

        if feedId == 1051:
            # Super.cz - A/B test
            lib_util.prepare_super_feed(req, feed)
        #endif

        lastUpdate = feed["lastUpdate"]
        if isinstance(lastUpdate, fastrpc.DateTime):
            feedTengData["lastUpdate"] = lastUpdate.unixTime
        else:  # v kesi je unixTime
            feedTengData["lastUpdate"] = lastUpdate
        #endif

        if "emailId" in feed:
            feedTengData["emailId"] = feed["emailId"]
        #endif

        feedItems = []
        showPreview = feedTengData["showPreview"]
        for item in feed["items"]:
            try :
                # pocet radku ve feedu pro prihlaseneho uzivatele
                if weatherFeedId == -1:
                    item["rowCount"] = feed["rowCount"]
                    item["feedId"] = feed["feedId"]
                #endif
                item["showPreview"] = showPreview
            except:
                # pocet radku ve feedu pro neprihlaseneho uzivatele
                # z konfiguraku
                pass
            #endtry

            # avoid XSS
            itemLink = item.get("link", "")
            if not itemLink.startswith("http://") and not itemLink.startswith("https://") and not feedIsOutage:
                item["link"] = ""
            #endif

            if feedIsOutage and feed["typeId"] == "tip":
                item["title"] = re.sub(r'href="[^"]*"',
                    'href="%s"' % req.config.feeds.outageUrl, item["title"])
            #enddef

            feedItems.append(item)
        #endfor
        feedTengData["items"] = feedItems

        # zvolime fragment sloupce pro dany feed
        feedColumnFrag = columnsDataRoot[feed["column"]]
        feedDataFrag = feedColumnFrag.addFragment("feed", feedTengData)

        # feed TV program, pridame tv program
        if feedId == 180:
            addTVContent(req, feedDataFrag)
        #endif

        # feed Poznamky, pridame poznamky
        if feedId == 188:
            addNoteContent(req, feedDataFrag)
        #endif

        # FIXME: check feed group (uncomment following line
        #        and remove the line after it)
        # if feed["groupId"] == "foreignemail" and feed.has_key("emailId"):
        if "emailId" in feed:
            addForeignEmailContent(req, feedDataFrag, feedTengData)
        #endif

        # feed kurzy men, pridame phm
        if feedId == req.config.rates.defaultCurrencyFeed:
            addGasContent(req, feedDataFrag)
        #endif
    #endfor
#enddef

def addSearchContent(req, dataRoot):
    """Prida informace o hledacich sluzbach
    """

    searchList = req.userInfo.listSearch(isHidden = False)
    if not searchList:
        # NB: Pokud je seznam prazdny, pouzijeme
        # default. Seznam muze byt prazdny pouze
        # pro uzivatele, kteri nemaji nic zmeneno.
        searchList = req.userInfo.defaultSearchList()
    #endif

    dbg.log("Using %s search for generate page", searchList, DBG = 1)
    searchFrag = dataRoot.addFragment("searches", {})
    for search in searchList:
        search["serviceUrl"] = "http://%s" % search["url"].split("://")[1].split("/")[0]
        searchFrag.addFragment("search", search)
    #endfor
#enddef

def addTitleContent(req, dataRoot, locality = 0):
    """Prida Seznam prinasime do dataRoot
    """

    now = mx.DateTime.now()
    nowStr = now.Format("%d.%m.%Y %H:%M:00")
    datetime = req.form.get.getfirst('dt', default = nowStr)

    try:
        dt = mx.DateTime.DateTimeFrom(datetime)
        dtStr = dt.Format("%d.%m.%Y %H:%M:00")
        dbg.log("setting date to %s", dtStr, INFO = 1)
        todayFrpc = mx.DateTime.DateTimeFrom(dtStr)

    except:
        todayFrpc = mx.DateTime.DateTimeFrom(nowStr)
    #endtry


    loc = req.form.get.getfirst('loc', int, default = -1)
    if loc > -1:
        dbg.log("setting locality to get arg: %d", loc, INFO = 1)
        locality = loc


    try:
        res = {}
        res = req.config.frog.proxy.title.getUserTitle(todayFrpc, locality)

        if res["status"] / 100 != 2:
            dbg.log("TITLE FRPC response: %d", res["status"], INFO = 2)
            return

        elif res["title"]:
            dataRoot.addFragment("title", res['title'])

    except Exception, e:
        dbg.log("TITLE FRPC failed to retrieve: %s", str(e), WARN = 3)
        pass




def prepareZodiac(req, feedList):
    """Podiva se do seznamu feedu, zda nahodou nemam zvolen nahodny
    horoskop, pokud ano, zmeni se id na konkretni nahodny horoskop
    """
    for feed in feedList:

        if feed["feedId"] == 185:
            # Uzivatel nema nastaveno znameni, pouzijeme nahodne
            if req.userInfo.zodiacFeedId == 185:
                feed["feedId"] = \
                    req.config.feeds.zodiacMapping[1].items()[random.randint(1, 12)][1]
                dbg.log("Add random zodiac feed: `%s'", feed["feedId"], INFO = 1)
            # Uzivatel ma nastaveno znameni, pouzijeme nastavene
            else :
                feed["feedId"] = req.userInfo.zodiacFeedId
                dbg.log("Add user zodiac feed: `%s'", req.userInfo.zodiacFeedId, INFO = 1)
            #endif
        #endif
    #endfor
#enddef


def prepareWeather(req, feedList):
    """Podiva se do seznamu feedu, na pocasi
    """

    for feed in feedList:
        if feed["feedId"] == 183:  # id pro Muze se hodit
            feed["feedId"] = req.userInfo.weatherFeedId
        #endif
    #endfor
#enddef


class NewsElection(object):
    def __init__(self, req):
        self.req = req

        self.mc = self.req.config.frog.proxy.config.mcache.client
        self.mc_key = "NEWS_ELECTION_2013"
        self.mc_key_switch = "NEWS_ELECTION_SWITCH"

        self.hp_feed = 94890
        self.fantasy_feed = 94891
        self.news_feed = 94892
    #enddef

    def get_data(self):
        election = None

        election = self.mc.get(self.mc_key)
        if election is not None:
            # Je to v mc ==> vratit

            election = pickle.loads(election)
            return election
        #endif

        #prepinatko v administraci (pred volbama / po volbach / vypnuto)
        sw = self.__get_config()
        dbg.log("Election switch: %s, %s", (sw, type(sw)), INFO=3)

        if sw == 1:
            # Pred volbama

            election = self.__get_rss_hp()

            if election is None:
                election = self.__get_rss_fantasy()
            #endif

        elif sw == 2:
            # Po volbach

            election = self.__get_rss_news()
        #endif

        if election is not None:
            # Konecne mame nejaka data

            try:
                source = json.loads(election.pop("source"))
                election["source"] = {"title": source["title"],
                                      "href": source["href"]}
            except Exception, e:
                dbg.log("Election Error <source>: %s", str(repr(e)), WARN=4)
            #endtry

            try:
                election["party"] = []
                for party in json.loads(election.pop("seznam_party")):
                    election["party"].append({"name": party["name"],
                                              "color": party["color"],
                                              "rate": party["rate"]})
                #endfor

                # seradit podle procent
                election["party"].sort(key=lambda x: float(x["rate"].replace(",", ".")), reverse=True)
            except Exception, e:
                dbg.log("Election Error <party>: %s", str(repr(e)), WARN=4)
            #endtry
        #endif

        # Do memcache
        p = pickle.dumps(election)
        self.mc.set(self.mc_key, p, time=30)

        return election
    #endddef

    def __get_feed(self, feed_id):
        res = self.req.config.frog.proxy.feed.getContent(feed_id)
        if res and res["status"] != 200:
            #TODO: muze byt chyba nebo jen nejsou data
            return []
        #endif

        return res.get("items", [])
    #enddef

    def __get_config(self):
        # Prepinatko do administrace (pred volbama / po volbach / vypnuto)
        try:
            sw = self.mc.get(self.mc_key_switch)
            if sw is not None:
                return int(sw)
            #endif

            cfg = self.req.config.frog.proxy.dbconfig.listAttributes(("election_switch",))["config"]
            sw = cfg.get("election_switch", 0)

            self.mc.set(self.mc_key_switch, sw, time=15)
            return int(sw)
        except Exception, e:
            dbg.log("Election Error db config: %s", str(repr(e)), WARN=4)
        #endtry

        return 0
    #enddef

    def __get_rss_hp(self):
        election = None

        for item in self.__get_feed(self.hp_feed):
            # Najit platna data z rss homepage
            try:
                now = datetime.datetime.now()
                show_from = datetime.datetime.strptime(item["seznam_showFrom"], "%Y-%m-%d %H:%M")
                show_to = datetime.datetime.strptime(item["seznam_showTo"], "%Y-%m-%d %H:%M")
                if now >= show_from and now <= show_to:
                    election = item
                    election["data_source"] = "homepage"
                    break
                #endif
            except Exception, e:
                dbg.log("Election Error rss homepage: %s", str(repr(e)), WARN=4)
                continue
            #endtry
        #endfor

        return election
    #enddef

    def __get_rss_fantasy(self):
        election = None

        for item in self.__get_feed(self.fantasy_feed):
            election = item
            break
        #endfor
        if election is not None:
            election["data_source"] = "fantasy"
        #endif

        return election
    #enddef

    def __get_rss_news(self):
        election = None

        for item in self.__get_feed(self.news_feed):
            election = item
            break
        #endfor
        if election is not None:
            election["data_source"] = "news"
        #endif

        return election
    #enddef
#endclass


def prepareWeatherItems(req, feedId, items):
    now = datetime.datetime.now()

    feed_items = []
    items_dict = {}

    for item in items:
        items_dict[item["seznam_weatherItemType"]] = item
    #endfor

    # pocet ikon podle poctu sloupcu
    cnt = 3 if req.userInfo.columns == 2 else 2

    if feedId == 99:
        # CR
        if now.hour >= 0 and now.hour < 8:
            feed_items = [items_dict["morning"], items_dict["afternoon"], items_dict["evening"]][:cnt]
        elif now.hour >= 8 and now.hour < 16:
            feed_items = [items_dict["afternoon"], items_dict["evening"], items_dict["night"]][:cnt]
        elif now.hour >= 16:
            if req.userInfo.columns == 2:
                feed_items = [items_dict["evening"], items_dict["night"], items_dict["tomorrow"]][:cnt]
            else:
                feed_items = [items_dict["evening"], items_dict["tomorrow"]]
            #endif
        #endif
    else:
        # Okresni mesta
        if now.hour >= 0 and now.hour < 8:
            feed_items = [items_dict["actual"], items_dict["morning"], items_dict["afternoon"]][:cnt]
        elif now.hour >= 8 and now.hour < 14:
            feed_items = [items_dict["actual"], items_dict["afternoon"], items_dict["evening"]][:cnt]
        elif now.hour >= 14 and now.hour < 19:
            feed_items = [items_dict["actual"], items_dict["evening"], items_dict["night"]][:cnt]
        elif now.hour >= 19:
            if req.userInfo.columns == 2:
                feed_items = [items_dict["actual"], items_dict["night"], items_dict["tomorrow"]]
            else:
                feed_items = [items_dict["actual"], items_dict["tomorrow"]]
            #endif
        #endif
    #endif

    return feed_items
#enddef


def patchFeeds(req, feedList):
    """
    Zpracujeme seznam feedu a pozmenime layout/settings dle pozadovane varianty
    """
    length = len(feedList)
    if length == 12:
        # reorder left column
        # vymena pro zeny vs. stream
        aux = feedList[4:6]
        feedList[4] = aux[1]
        feedList[5] = aux[0]

        if req.userInfo.variation == "A":
            dbg.log("patchFeeds: variation = %s", req.userInfo.variation, DBG = 1)
            for feed in feedList:
                # super.cz
                if feed["feedId"] == 1051:
                    # zkraceni o 1 clanek; 
                    if feed["rowCount"] == 4:
                        feed["rowCount"] = 3
                    # odstraneni nahledu
                    feed["showPreview"] = False
                # prozeny
                if feed["feedId"] == 71510:
                    # odstraneni nahledu
                    feed["showPreview"] = False
                # stream
                if feed["feedId"] == 194:
                    # odstraneni nahledu
                    feed["showPreview"] = False

        if req.userInfo.variation == "B":
            dbg.log("patchFeeds: variation = %s", req.userInfo.variation, DBG = 1)
            for feed in feedList:
                # super.cz
                if feed["feedId"] == 1051:
                    # zkraceni o 1 clanek; 
                    if feed["rowCount"] == 4:
                        feed["rowCount"] = 3
                # stream.cz
                if feed["feedId"] == 194:
                    # zkraceni na 2 clanky
                    if feed["rowCount"] == 3:
                        feed["rowCount"] = 2
                    # odstraneni nahledu
                    feed["showPreview"] = False

        # reorder right column
        aux = feedList[-4:]
        feedList[length - 4] = aux[1]
        feedList[length - 3] = aux[3]
        feedList[length - 2] = aux[0]
        feedList[length - 1] = aux[2]

def jsTvDescription(req):
    """Popis TV programu
    """

    id = req.form.post.getfirst("id", int, default = 0)

    dbg.log('Getting Tv details for programme %s', (id,), DBG = 1)

    # zakladni informace o uzivateli
    dataRoot = req.config.teng.createDataRoot({})

    try:
        # Vytahneme porad
        res = req.config.tvServer.proxy.programme.getAttributes(id)
        if res['status'] == 200:
            programmeAttributes = res["programmeAttributes"]
            dataRoot.addFragment("tv", {
                "description" : programmeAttributes["longDescription"] \
                                or programmeAttributes["shortDescription"],
                "title" : programmeAttributes["title"],
                "channel" : programmeAttributes["channelName"],
                "time" : programmeAttributes["timeFrom"].unixTime,
                "type" : programmeAttributes["programmeTypeName"]
            })
        else:
            dbg.log("Frog return: %s", (res["statusMessage"]), WARN = 2)
        #endif

    except (fastrpc.Fault, fastrpc.Error), e:
        dbg.log('Ignoring FastRPC error: %s', str(e), WARN = 3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    except:
        dbg.log('Ignoring unknown error', WARN = 3)
        raise
    else:
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endif

    # generuj stranku
    lib_util.generatePage(req, 'js_tvDescription.js', dataRoot, req.config.template.defaultLanguage,
                    contentType = 'text/html',
                    responseContentType = 'application/x-javascript; charset=utf-8',
                    encoding = "utf-8")
    return apache.OK
#enddef


def generateTvProgram(req, tvRoot, fromDate, toDate, tip, crop, encoding):
    """Vygeneruje TV program
    """

    forceTvTip = False

    # Zkusime nacist tip dne
    try:
        day = fastrpc.DateTime(fromDate.split()[0])
        res = req.config.frog.proxy.tvTip.getAttributes(day)
        if res["status"] == 200:
            now, tvTip = fastrpc.LocalTime(), res["tips"][0]

            if (tvTip['expires'].unixTime > now.unixTime
              and len(tvTip['programmes']) == 3
            ):
                forceTvTip = not req.userInfo.tvTipDisabled

                for program in tvTip['programmes']:
                    # fix preview picture
                    if not program["picture_url"]:
                        fmt = "/favicons/preview_%d.jpg"
                        fmtArg = program["id"]
                    else:
                        fmt = "/favicons/tv/%s"
                        fmtArg = program["picture_url"]
                    #endif
                    program["picture_url"] = fmt % fmtArg

                    tvRoot.addFragment("tip_item", program)
                #endfor
            #endif
        #endif
    except:
        pass
    #endtry

    # pokud tv tip neexistuje nebo je vypnut zobrazime to co prave bezi
    tvRoot.addVariable("type", "tips" if forceTvTip else "now")

    # Vytahneme porady
    if req.userInfo.loggedUser and req.userInfo.tvChannelId:
        channelList = req.userInfo.tvChannelId
        dbg.log("Use TV channel `%s'", channelList, INFO = 1)
    else:
        channelList = req.config.tv.defaultTvChannels
        dbg.log("Use default TV channel `%s'", channelList, INFO = 1)
    #endif

    try:
        res = req.config.tvServer.proxy.hp.filterTvProgram(
                channelList, fastrpc.DateTime(fromDate),
                fastrpc.DateTime(toDate), {"onlyTip": fastrpc.Boolean(tip)})
        if res['status'] == 200:

            # seradime tv program podle stanic a casu
            res['tvProgram'].sort(lambda x, y: cmp(channelList.index(x['channelId']), channelList.index(y['channelId'])))

            # Proiterujeme televize
            for tv in res["tvProgram"]:

                # Vypocteme progress
                now = int(mx.DateTime.now().Format("%s"))
                timeStart = int(tv["timeStart"].unixTime)
                timeEnd = int(tv["timeEnd"].unixTime)

                # Pokud sortime porady podle casu (ne tipy a now), vynechame ty, ktere
                # maji zacatek pred specifikovanou dobou
                try:
                    if crop:
                        fromH = int(fromDate[11:13])
                        toH = int(toDate[11:13])
                        timeS = int(tv["timeStart"].hour)

                        if (fromH > 10 and timeS < fromH) or \
                           (fromH < 10 and timeS > fromH) or \
                           (timeS == toH):
                            continue
                        #endif
                    #endif
                except (KeyError, ValueError, TypeError):
                    pass
                #endtry

                if now > timeStart and now < timeEnd:
                    interval = abs(timeEnd - timeStart)
                    interval_cent = float(float(interval) / 100)
                    if interval_cent:
                        progress = int(float(round((now - timeStart)) \
                                       / interval_cent))
                    else:
                        progress = 0
                    #endif
                elif now > timeEnd:
                    progress = 100

                else:
                    progress = 0
                #endif

                # A plnime teng
                if encoding == "utf-8":
                    tvRoot.addFragment("item", {
                            "id": tv["id"],
                            "title": tv["title"],
                            "channelId": tv["channelId"],
                            "channel": tv["channelName"],
                            "time": tv["timeStart"].unixTime,
                            "timeTo": tv["timeEnd"].unixTime,
                            "progress": progress,
                            "type": tv["typ"],
                            })
                else:
                    tvRoot.addFragment("item", {
                            "id": tv["id"],
                            "title": _cnv(tv["title"], encoding),
                            "channelId": tv["channelId"],
                            "channel": _cnv(tv["channelName"], encoding),
                            "time": tv["timeStart"].unixTime,
                            "timeTo": tv["timeEnd"].unixTime,
                            "progress": progress,
                            "type": tv["typ"],
                            })
                #endif
            #endfor
        #endif
    except:
        pass
    #endtry
#enddef


def jsTvGetChannels(req):
    """
    Popis TV programu
    """

    type = req.form.post.getfirst("type", str, "tips")

    dbg.log("Getting Tv for %s", (type), DBG = 1)

    # zakladni informace o uzivateli
    dataRoot = req.config.teng.createDataRoot({"type" : type})
    tvRoot = dataRoot.addFragment("tv", {})

    try:
        # Default hodnoty
        tip = True
        fromDate = mx.DateTime.now().Format("%Y-%m-%d 00:00:00")
        toDate = mx.DateTime.now().Format("%Y-%m-%d 23:59:59")
        crop = 0 # signalizace orezu meznich hodin

        # Podle typu defualt pozmenime
        if type == "now":
            tip = False
            fromDate = mx.DateTime.now().Format("%Y-%m-%d %H:%M:00")
            toDate = mx.DateTime.now().Format("%Y-%m-%d %H:%M:00")

        elif type.find("_") > 0:
            tip = False
            crop = 1 # budeme orezavat mezni hodiny
            (fromHour, toHour) = type.split("_")

            if int(fromHour[0:2]) <= 23 or mx.DateTime.now().hour <= 5:
                fromDate = fromDate.replace("00:00:00", "%s:%s:00" % (fromHour[0:2], fromHour[2:4]))
            else:
                fromHour = '%02d%s' % (int(fromHour[0:2]) % 24, fromHour[2:4])
                fromDate = (mx.DateTime.now() + mx.DateTime.oneDay).Format("%Y-%m-%d 00:00:00")
                fromDate = fromDate.replace("00:00:00", "%s:%s:00" % (fromHour[0:2], fromHour[2:4]))
            #endif

            if int(toHour[0:2]) <= 23 or mx.DateTime.now().hour <= 5:
                toDate = toDate.replace("23:59:59", "%s:%s:00" % (toHour[0:2], toHour[2:4]))
            else:
                toHour = '%02d%s' % (int(toHour[0:2]) % 24, toHour[2:4])
                toDate = (mx.DateTime.now() + mx.DateTime.oneDay).Format("%Y-%m-%d 23:59:59")
                toDate = toDate.replace("23:59:59", "%s:%s:00" % (toHour[0:2], toHour[2:4]))
            #endif
        #endif

        # sestavime TV program
###        generateTvProgram(req, tvRoot, fromDate, toDate, tip, crop, encoding)
        generateTvProgram(req, tvRoot, fromDate, toDate, tip, crop, "utf-8")

    except (fastrpc.Fault, fastrpc.Error), e:
        dbg.log('Ignoring FastRPC error: %s', str(e), WARN = 3)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    #except:
        dbg.log('Ignoring unknown error', WARN = 3)
    #    dataRoot.addFragment("result", {"status" : 500,
    #                                    "statusMessage" : "internal_error"})
    else:
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endif


    # generuj stranku
    lib_util.generatePage(req, 'js_tvChange.js', dataRoot,
                    req.config.template.defaultLanguage,
                    contentType = 'text/html',
                    responseContentType = 'application/x-javascript; charset=utf-8',
                    encoding = "utf-8") # as we don't support ie5.0 anymore,
                                        # we're using utf-8 everywhere

    return apache.OK
#enddef


def jsWeatherGetCities(req):
    """Listuje mesta pro nastaveni pocasi
    """

    countyId = req.form.post.getfirst("countyId", int, 1)
    if not lib_uiradr.countyCodes.has_key(countyId):
        countyId = 1
    #endif

    dataRoot = req.config.teng.createDataRoot({})

    county = lib_uiradr.countyCodes[countyId]
    for district in county["districts"]:
        dataRoot.addFragment("district", {
            "id"       : district,
            "name"     : lib_uiradr.district[district][0]})
    #endfor

    dataRoot.addFragment("result", {"status" : 200,
                                    "statusMessage" : "ok"})

    # generuj stranku
    lib_util.generatePage(req, 'js_weatherCities.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef

def jsRSS(req):
    """
    Javascriptove poskytnuti obsahu Moje zpravy
    """

    return _generateRSSContent(req, 'js_rss.js', 'application/x-javascript', True)
#enddef


def jsTitleExecute(req):
    """
    method to call when title link is clicked 
    """
    titleId = req.form.post.getfirst("id", int, default = 0)
    if titleId == 0:
        titleId = req.form.get.getfirst("id", int, default = 0)

    titleHash = req.form.post.getfirst("h", str, default = "")
    if not titleHash:
        titleHash = req.form.get.getfirst("h", str, default = "")

    try:
        res = req.config.frog.proxy.title.getAttributes(titleId)
    except (fastrpc.Fault, fastrpc.Error, fastrpc.ProtocolError):
        return lib_util.redir(req, "/")

    if res['status'] / 100 != 2:
        return lib_util.redir(req, "/")

    if "title" in res:
        title = res["title"]

        if "hash" in title:
            if title["hash"] != titleHash:
                return lib_util.redir(req, "/")

        #add hit to title
        try:
            res = req.config.frog.proxy.title.addHit(titleId)
        except (fastrpc.Fault, fastrpc.Error, fastrpc.ProtocolError):
            pass
        #endtry

        if not title['url']:
            return lib_util.redir(req, "/")

        return lib_util.redir(req, title['url'])
    #endif

    return lib_util.redir(req, "/")

def readerMenuScreen(req):
    """
    Vrati menu s RSS zdroji pro RSS ctecku
    """

    return _generateRSSContent(req, 'reader_menu.html', 'text/html', False)
#enddef


def readerFeedScreen(req):
    """
    Vrati obsah jednoho zvoleneho feedu daneho uzivatele pro ctecku
    """

    try:
        feedId = req.form.get.getfirst('feedId', int, 0)

        dataRoot = req.config.teng.createDataRoot({})
        res = req.config.frog.proxy.feed.getContent(feedId,
                req.config.feeds.outageUrl)
        if res['status'] == 200:
            del res['status']
            del res['statusMessage']
            # povol vsechny polozky
            res['maxItems'] = 999

            # avoid XSS
            if not res['serverUrl'].startswith('http://'):
                res['serverUrl'] = ''
            #endif

            r = re.compile('(<[^>]+)(javascript:| onmouse| onkey | onblur| onfocus| style)', re.IGNORECASE)
            s = re.compile('<(script|style)[^<]+', re.IGNORECASE)

            for item in res['items']:
                if not item.get('link', '').startswith('http://'):
                    item['link'] = ''
                #endif

                item['description'] = s.sub(r'', r.sub(r'\1 xxx', item.get('description', '')))
            #endfor

            # potrebne konverze
            res['allowHtml'] = int(res['allowHtml'])
            res['allowImage'] = int(res['allowImage'])

            dataRoot.addFragment("feed_%s" % res['typeId'], res)
        else:
            dbg.log("Failed to get feedId=%d: <%d, %s>", (feedId, res['status'], res['statusMessage']), WARN = 3)
        #endif

        # vypiseme stranku
        lib_util.generatePage(req, 'reader_feed.html', dataRoot, req.config.template.defaultLanguage)

        return apache.OK

    except (ValueError, KeyError, TypeError), e:
        dbg.log('Failed to serve feed for userId=%d: %s', (req.userInfo.userId, str(e)), WARN = 2)
    #endtry

    req.content_type = 'text/plain'
    req.write("")
    return apache.OK
#enddef


def readerScreen(req):
    """
    """

    rssUrl = ''
    try:
        fid = req.form.get.getfirst('fid', int)
        item = req.form.get.getfirst('item', int)

        # pokud mame feed a cislo  itemu v nem, stahneme content a zjistime link
        if fid and item >= 0:
            rssList = req.userInfo.listFeeds()
            for feed in rssList:
                if feed['feedId'] == fid:
                    res = req.config.frog.proxy.feed.getContent(fid,
                            req.config.feeds.outageUrl)
                    if res['status'] == 200:
                        rssUrl = res['items'][item].get('link', '')
                    #endif

                    break
                #endif
            #endfor
        #endif

    except (KeyError, ValueError, TypeError):
        pass
    #endtry

    # root fragment
    dataRoot = req.userInfo.createDataRoot()
    dataRoot.addVariable('rss_link', rssUrl)

    # vypiseme stranku
    lib_util.generatePage(req, 'reader.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def servicesScreen(req):
    """Zobrazi stranku dalsi sluzby na seznamu
    """

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # vypiseme stranku
    lib_util.generatePage(req, 'services.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def jsTestSSL(req):
    """
    """

    ip = req.form.get.getfirst("ip", default = "")
    formId = req.form.get.getfirst("formId", default = "login-form")
    urlType = req.form.get.getfirst("type", default = "0")

    remoteIp = req.headers_in.get(req.config.control.forwardedForHeader,
            req.connection.remote_ip)
    remoteIp = lib_util.getLastIp(remoteIp)

    # c-class
    ip = ip[:ip.rfind('.')]
    remoteIp = remoteIp[:remoteIp.rfind('.')]

    data = {}
    if ip == remoteIp:
        data["success"] = {
            'formId' : formId,
            'type'   : urlType
        }
    #endif

    # vypiseme stranku
    lib_util.generatePage(req, 'js_testSSL.js', data,
                    req.config.template.defaultLanguage,
                    contentType = 'text/html',
                    responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def firefox(req):
    """Zobrazi stranku Homepage Firefoxu s nahodne vybranym snippetem
    """

    dataRoot = req.config.teng.createDataRoot({
            'snippet' : random.randrange(10),
            'suggest' : req.userInfo.suggest,
        })

    lib_util.generatePage(req, 'firefox.html',
        dataRoot, req.config.template.defaultLanguage)

    return apache.OK
#enddef


def userSearch(req):
    """Provede presmerovani na
    uzivatelem definovane hledani
    """
    # hledany vyraz
    q = req.form.get.getfirst("q", str)
    # url, kde se bude hledat
    url = req.form.get.getfirst("url", str)
    # encoding do ktereho se prevede q
    encoding = req.form.get.getfirst("encoding", str)

    # query prekodovat do potrebneho encodingu
    q = _cnv(q, encoding, "ignore")

    url = url.replace("\r", "\n")
    newlinePos = url.find("\n")
    if newlinePos != -1:
        url = url[:newlinePos]
    #endif
    quoted = url % urllib.quote(q)

    # co a kde se hleda
    dbg.log("Search phrase: `%s', search URL: `%s'", (q, quoted), INFO = 4)

    # redirect na jinou sluzbu
    return lib_util.redir(req, quoted)
#enddef


def redirectProcess(req):
    """Provede presmerovani na zadany odkaz
    """

    url = req.form.get.getfirst("url", str)

    if url.find("http://") == -1 \
        and url.find("https://") == -1 \
        and url.find("ftp://") == -1:

        url = "http://%s" % url
    #endif

    req.headers_out.add('Location', url)

    return apache.HTTP_MOVED_PERMANENTLY
#enddef


def generateCatalogue(req):
    """
    Stranka vygeneruje novou sablonu se sekcemi katalogu
    """

    try:
        if req.form.get.getfirst('type', default = '') == 'top':
            rng = [ord('0')]
            templ = '_catalogue.html'
        else:
            rng = xrange(ord('A'), ord('Z') + 1)
            templ = '_js_catalogueABC.js'
        #endif

        # nacti konfigurak
        parser = ConfigParser.ConfigParser()
        f = open(req.config.control.catalogueSections, "r")
        parser.readfp(f)
        f.close()

        dataRoot = req.config.teng.createDataRoot({})

        for letter in rng:

            dbg.log("Processing letter `%s'", chr(letter), DBG = 4)

            lfrag = dataRoot.addFragment('letter', {
                       'letter' : chr(letter),
                       'smallLetter' : chr(letter + 32),
                   })

            section = 'letter.%s' % chr(letter)
            try:
                options = []
                options.extend(parser.options(section))
                options.sort(lambda x, y : cmp(x.split('_')[0], y.split('_')[0]))

            except ConfigParser.NoSectionError:
                dbg.log("No [%s] `%s'", (section, req.config.control.catalogueSections), WARN = 1)
                continue
            #endtry

            for opt in options:

                id = int(opt.split('_')[1])
                try:
                    title = parser.get(section, opt)
                except ConfigParser.NoOptionError:
                    dbg.log("No [%s]::%s in `%s'", (section, opt, req.config.control.catalogueSections), WARN = 1)
                    continue
                #endtry

                dbg.log("Processing id=%d, title=%s", (id, title), DBG = 1)
                # UMIME PRACOVAT CELKEM SE 3 ZPUSOBY ZJISTENI CESTY K SEKCI V KATALOGU
                # viz. req.config.control.catalogueGenerateMode
                    # search   pres search server, firmy 2006
                    # mm_old   pres MoneyMaker, stara verze
                    # mm_new   pres MoneyMaker, verze od 2006
                if req.config.control.catalogueGenerateMode == 'mm_old':
                    res = req.config.search.proxy.interface('listSection', 'id=%d' % id)
                    if res['status'] == 200:
                        res['path'] = res['output'][0]['fulldir']
                    #endif
                elif req.config.control.catalogueGenerateMode == 'mm_new':
                    res = req.config.search.proxy.section.getAttributes(id)
                    if res['status'] == 200:
                        res['path'] = res['output']['fulldir']
                    #endif
                else:
                    res = req.config.search.proxy.category.getAttr(id)
                #endif

                if res['status'] != 200:
                    dbg.log("Failed to get catalogue section id=%d: <%d, %s>",
                        (id, res['status'], res['statusMessage']), WARN = 3)
                else:
                    lfrag.addFragment('item', {
                        'title' : title,
                        'link'  : res['path'],
                    })
                #endif
            #endfor
        #endfor

        lib_util.generatePage(req, templ, dataRoot,
                req.config.template.defaultLanguage,
                contentType = 'text/html', responseContentType = 'application/x-javascript; charset=utf-8')

        return apache.OK

    except:
        # vratime internal errror
        pass
    #endtry

    req.config.edbg.log("Error generate catalogue: %s", lib_error.getExceptionString(), ERR = 4)
    dbg.log("Error generate catalogue: %s", lib_error.getExceptionString(), ERR = 4)
    return apache.HTTP_INTERNAL_SERVER_ERROR
#enddef


def jsCatalogue(req):
    """
    Povoli nebo zakaze zobrazeni katalogu
    """

    # data root
    dataRoot = req.config.teng.createDataRoot({})
    # takto si budeme signalizovat, zda doslo k uspesne aktualizaci
    actionDone = 0

    try:
        action = req.form.get.getfirst('action', default='')
        hid = req.form.get.getfirst('hid', default='')
        try:
            req.userInfo.verifyHashId(hid)
        except ValueError:
            dbg.log('Hash hid=%s does not match for user userId=%d', (hid, req.userInfo.userId), WARN=3)
            raise
        #endtry

        # overime akci
        if req.userInfo.loggedUser and (action in ['show', 'hide']):
            res = req.config.frog.proxy.user.setAttributes(req.userInfo.userId, {
                    'hideCatalogue' : fastrpc.Boolean(action == 'hide')
                    })
            if res['status'] == 200:
                actionDone = 1
                dataRoot.addVariable('status', action)
            else:
                dbg.log('Failed to %s catalogue for userId=%d: <%d, %s>', (\
                         action, req.userInfo.userId, res['status'],
                         res['statusMessage']), WARN = 3)
                #endif
            #endif
        #endif

    except (KeyError, ValueError, TypeError), e:
        dbg.log('Ignoring accessing bad value: %s', str(e), WARN = 3)
    except (fastrpc.Fault, fastrpc.Error), e:
        dbg.log('Ignoring FastRPC error: %s', str(e), WARN = 3)
    except:
        dbg.log('Ignoring unknown error', WARN = 3)
    #endif

    # nepodarilo se provest akci
    if not actionDone:
        dataRoot.addVariable('status', 'error')
    #endif

    # generuj stranku
    lib_util.generatePage(req, 'js_catalogue.js', dataRoot, req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def jsCatalogueABC(req):
    """
    Povoli nebo zakaze zobrazeni katalogu
    """

    # data root
    dataRoot = req.config.teng.createDataRoot({
        'letter' : req.form.get.getfirst('letter', default = 'A').upper()
        })

    dataRoot.addFragment("result", {"status" : 200,
                                    "statusMessage" : "ok"})

    # generuj stranku
    lib_util.generatePage(req, 'js_catalogueABC.js', dataRoot, req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def staticInfoScreen(req):
    dataRoot = req.config.teng.createDataRoot({})
    lib_util.generatePage(req, "static_info.html", dataRoot, req.config.template.defaultLanguage,
                          contentType = "text/html")
    return apache.OK
#enddef


def contentDispatcher(req) :
    """
    """
    return apache.HTTP_NOT_FOUND

    alert = req.form.get.getfirst("alert", str, "")

    if req.method != "GET":
        return redirect.unknownUrl(req)
    #endif

    dbg.log("Content dispatcher: uri=%s", req.uri, INFO = 3)
    parts = req.config.contentRegExp.sub("/", req.uri[1:]).split("/")
    type = parts[0]
    parts = parts[1:]

    dataRoot = req.userInfo.createDataRoot()
    dataRoot.addVariable("alert", alert)
    dataRoot.addVariable('lide_hashId', lib_util.lide_idToHash(req.userInfo.userId))

    if type == "nastavit-jako":
        if len(parts) == 0:
            # vyrenderovat presets.html
            lib_util.generatePage(req, "presets.html", dataRoot, req.config.template.defaultLanguage,
                                  contentType = "text/html")
            return apache.OK
        else:
            # vyrenderovat presets.html
            if req.config.presetNameRegExp.match(parts[0]):
                dbg.log("Preset: %s", parts[0], INFO = 2)

                path = req.config.template.path
                path = "%s/presets/%s.html" % (path, parts[0])
                dbg.log("Checking whether file %s exists", path, INFO = 2)
                try:
                    open(path, "r").close()
                except:
                    dbg.log("Preset %s doesn't exist", parts[0], WARN = 2)
                    pass
                else:
                    dbg.log("Preset %s exists", parts[0], INFO = 2)
                    lib_util.generatePage(req, "presets/%s.html" % parts[0], dataRoot, req.config.template.defaultLanguage,
                                          contentType = "text/html")
                    return apache.OK
                #endtry
            #endif
        #endif
    #endif

    return redirect.unknownUrl(req)
#enddef

def generateFirmyRandomCategory(req):
    try:
        res = req.config.firmSearch.proxy.getRandomCategory()
        if res["status"] != 200:
            raise lib_error.UnexpectedResponse(req.config.firmSearch.proxy, res)
        #endif

        data = res["categoryAttributes"]

        dataRoot = req.config.teng.createDataRoot(data)

        lib_util.generatePage(req, "_firmy_random_category.html",
            dataRoot, req.config.template.defaultLanguage,
            contentType = "text/html")
    except:
        pass
    #endtry

    return apache.OK
#enddef

def mobileNoredir(req):
    lib_util.setNoredirCookie(req)

    return lib_util.redir(req, "/")
#enddef


def setBetaCookie(req):
    # Nastavi beta cookie v pripade, ze je beta povolena v administraci
    beta_sw = lib_util.get_dbconfig_switch(req, "beta_switch", "BETA_2015_SWITCH", ttc=15)

    if beta_sw:
        lib_util.setBetaCookie(req, "hp_beta_2015", expires=64281600)
    #endif

    return lib_util.redir(req, "/")
#enddef

