#!/usr/bin/env python2.5
#
# $Id$
"""
DESCRIPTION   Setup
"""

from mod_python import apache
from dbglog     import dbg
from time       import sleep

import fastrpc
import urllib
import types
import lib.error


def _convertMappings(id, req):
    if req.config.feeds.zodiacMapping[0].has_key(id):
        return 185
    elif req.config.feeds.weatherMapping[0].has_key(id):
        return 99
    else:
        return id
    #endif
#enddef


def jsFeedAdd(req):
    """Zalozi novy feed uzivateli
    """

    try:
        ids = req.form.post.getfirst("id", str)

        ids = map(int, ids.split(","))

        # data root
        dataRoot = req.config.teng.createDataRoot({})

        # zavolat presum feedu
        for id in ids :
            # struktura feedu
            feedAttributes = {
                "feedId"      : id,
                "column"      : 0,
                "showPreview" : fastrpc.Boolean(0),
                "rowCount"    : 5
            }

            # pridam uzivateli
            req.userInfo.addFeed(feedAttributes)
        #endfor

    except :
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500})
    else:
        dataRoot.addFragment("result", {"status" : 200})
    #endif

    # generuj stranku
    lib_util.generatePage(req, 'js_feedAdd.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def jsFeedMove(req):
    """Presune feed v poradi na jine misto
    """
    columns = req.form.post.getfirst("columns", str)

    dbg.log("Columns: %s", columns, INFO = 4)

    feedList = []
    for row in columns.split(":"):
        if row:
            feedList.append([_convertMappings(int(x), req) for x in row.split(",") if x.isdigit()])
        else:
            feedList.append([])
        #endif
    #endfor

    # data root
    dataRoot = req.config.teng.createDataRoot({})

    # zavolat presum feedu
    try :
        req.userInfo.moveFeed(feedList)
    except :
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else :
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endif

    # generuj stranku
    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def jsFeedRemove(req):
    """Smaze uzivatelsky feed
    """
    # id feedu, ktery chceme vymazat
    feedId = req.form.post.getfirst("feedId", int)

    # konverze horoskopu a pocasi
    feedId = _convertMappings(feedId, req)

    # data root
    dataRoot = req.config.teng.createDataRoot({})

    # zavolat vymazani feedu
    try :
        req.userInfo.removeFeed(feedId)
    except :
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else:
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endif

    # generuj stranku
    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def addFeed(req):
    """
    """

    url = req.form.get.getfirst('url', default = '')
    title = req.form.get.getfirst('title', default = '')
    if type(title) == types.UnicodeType:
        title = title.encode('utf-8', 'replace')
    #endif

    return lib_util.redir(req, '/nove-nastaveni?rss_url=%s&rss_title=%s#obsah' % (\
                urllib.quote_plus(url), urllib.quote_plus(title)))

    # TODO: zvysok kodu + addFeedProcess mozu by neskor vymazane 

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # standardni flagy na strance
    lib_util.addScreenFlags(req.form.get, dataRoot)

    if not req.userInfo.userId:
        return lib_util.redir(req, '/prihlaseni?goto=addfeed&url=%s&title=%s' % (\
                    urllib.quote_plus(url), urllib.quote_plus(title)))
    #endif

    if url and lib_util.checkSource(req, url):
        dataRoot.addFragment('newFeed', {
                'title' : title,
                'url'   : url})
    else:
        dataRoot.addFragment('badArguments', {
                'title' : title,
                'url'   : url})
    #endif

    # vypiseme stranku
    lib_util.generatePage(req, 'addfeed.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def jsFeedList(req):
    """Vylistuje seznam feedu pro uzivatele
    """
    # data root
    dataRoot = req.config.teng.createDataRoot({})

    try :

        # zjistim, zda ma uzivatel
        # najake feedy
        feeds = req.userInfo.getFeeds()

        # prida fragment aktualniho stavu hledani
        feedFrag = dataRoot.addFragment("feeds", {})
        for feed in feeds :
            feedFrag.addFragment("feed", feed)
        #endfor

    except :
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500})
    else:
        dataRoot.addFragment("result", {"status" : 200})
    #endif

    # generuj stranku
    lib_util.generatePage(req, 'js_feedList.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def jsFeedProcess(req):
    """Ulozeni feedu
    """

    # data root
    dataRoot = req.config.teng.createDataRoot({})

    # parametry z url
    ids = req.form.post.getfirst('id', str)

    # parametry z requestu (prevedeme na list<int>)
    list = []

    if ids :
        # horoskop a pocasi
        for id in ids.split(","):
            try:
                feedId = _convertMappings(int(id), req)
                feed = { "feedId" : feedId }
                if feedId == 190: # gmail
                    feed["rowCount"] = 5
                #endif
                list.append(feed)
            except ValueError:
                pass
        #endfor
    #endif

    try:
        req.userInfo.feedUpdate(list)
    except :
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500})
    else:
        dataRoot.addFragment("result", {"status" : 200})
    #endif

    # generuj stranku
    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def addFeedProcess(req):
    """
    """

    if req.form.post.get('cancel', default = ''):
        return lib_util.redir(req, '/')
    #endif

#    hid = req.form.post.getfirst('hashId', default='')
#    if not req.userInfo.verifyHashId(hid):
#        dbg.log('Hash hid=%s does not match for user userId=%d', (hid, req.userInfo.userId), WARN=3)
#        return lib_util.redir(req, '/prihlaseni?goto=addfeed')
#    #endif

    url = req.form.post.getfirst('url', default = '')
    title = req.form.post.getfirst('title', default = '')

    if url and lib_util.checkSource(req, url):
        res = req.config.frog.proxy.feed.create(title, url, \
                req.config.control.userGroupId, { 'typeId' : 'rss' })
        if res['status'] not in [200, 201]:
            raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
        #endif

        feedId = res['feedId']
        dbg.log('Created feedId=%d or url %s with status %d for userId=%d',
            (feedId, url, res['status'], req.userInfo.userId), INFO = 3)

        # pridame feed uzivateli
        res = req.config.frog.proxy.user.feed.add(req.userInfo.userId,
                                                  {"feedId" : feedId,
                                                   "column" : 0})
        if res['status'] not in [200, 201]:
            raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
        #endif
    else:
        req.headers_out.add('Location', '/pridej-zpravy?url=%s&title=%s' % (url, title))
        return apache.HTTP_MOVED_PERMANENTLY
    #endif

    req.headers_out.add('Location', '/nastaveni-zprav?saved=1')
    return apache.HTTP_MOVED_PERMANENTLY
#enddef


def promoteScreen(req):
    """
    """

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # vypiseme stranku
    lib_util.generatePage(req, 'promote.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def aboutRssScreen(req):
    """
    """

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # vypiseme stranku
    lib_util.generatePage(req, 'about_rss.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef





def setupZodiacScreen(req):
    """Volba nastaveni horoskopu
    """

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # standardni flagy na strance
    lib_util.addScreenFlags(req.form.get, dataRoot)

    #feedId = None
    # ziskame RSS zdroje uzivatele, ze kterych vytahneme nastaveny horoskop
    #feedList = req.userInfo.listFeeds()
    #for feed in feedList:
    #    if feed["typeId"] == "zodiac" :
    #        # Nasli jsme nastavene znameni,
    #        # pridame do fragmentu promnnou a ukoncime cyklus
    #        feedId = feed['feedId']
    #        break
    #    #endif
    ##endfor
    feedId = req.userInfo.zodiacFeedId

    # predame do tengu horoskopy.
    # v uzivatelove pridame promennou selected=1
    for z in req.config.feeds.zodiacMapping[2]:
        z["selected"] = 0
        if z["feedId"] == feedId:
            z["selected"] = 1
        #endif
        dataRoot.addFragment('zodiac', z)
    #endfor

    # vypiseme stranku
    lib_util.generatePage(req, 'setup_zodiac.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def setupZodiacCore(req):
    """Nastavi predvolene znameni horoskopu
    """

    feedId = req.form.post.getfirst('zodiacId', int, -1)

    req.userInfo.zodiacFeedId = feedId
    req.userInfo.setAttributes(req)

    return feedId
#enddef


def setupZodiacProcess(req):
    """Nastavi predvolene znameni horoskopu
    """

    #
    setupZodiacCore(req)

    #
    return lib_util.redir(req, '/nastaveni-horoskopu?saved=1')
#enddef


def jsSetupZodiacProcess(req):
    """Nastavi predvolene znameni horoskopu
    """

    # data root
    dataRoot = req.config.teng.createDataRoot({})

    feedId = setupZodiacCore(req)

    # sleep kvuli replikaci
    sleep(1)

    # vratime obsah feedu
    res = req.config.frog.proxy.feed.getContent(feedId,
            req.config.feeds.outageUrl)
    if res['status'] != 200:
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else:
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})

        dataRoot.addFragment("feedAttributes", res)
    #endif

    # generuj stranku
    lib_util.generatePage(req, 'js_setupZodiac.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def jsSetupTvCore(req, dataRoot):
    """Volba nastaveni TV stanic
    """

    # Vylistujeme si vsechny channely
    res = req.config.tvServer.proxy.hp.listTvChannels()
    if res['status'] != 200:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
    #endif

    # A pridame je do tengu
    for tv in res["tvChannelId"]:

        tv["selected"] = 0
        if tv["id"] in req.userInfo.tvChannelId:
            tv["selected"] = 1
        #endif

        dataRoot.addFragment('tv', tv)
    #endfor
#enddef


def jsSetupTvScreen(req):
    """Volba nastaveni TV stanic
    """

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # standardni flagy na strance
    lib_util.addScreenFlags(req.form.get, dataRoot)

    # core
    jsSetupTvCore(req, dataRoot)

    # generuj stranku
    lib_util.generatePage(req, 'js_listTVScreen.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def setupTvScreen(req):
    """Volba nastaveni TV stanic
    """

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # standardni flagy na strance
    lib_util.addScreenFlags(req.form.get, dataRoot)

    # core
    jsSetupTvCore(req, dataRoot)

    # vypiseme stranku
    lib_util.generatePage(req, 'setup_tv.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def setupTvCore(req):
    """Nastavi predvolene TV stanice
    """

    # Vytahneme nastavene znameni
    userTv = req.form.post.getlist('userTv', int)
    # nastaveni tipu
    tvTipDisabled = req.form.post.getfirst('tvTipDisabled', int, 0)

    # Nastavime televize userovi
    #res = req.config.frog.proxy.user.setAttributes(req.userInfo.userId, {
    #    "tvChannelId": userTv })

    if not req.userInfo.createdOnTvServer:
        res = req.config.tvServer.proxy.user.create({
            "id" : req.userInfo.userId,
            "username" : req.userInfo.username,
            "domain" : req.userInfo.domain,
            "channels" : userTv})
    else:
        res = req.config.tvServer.proxy.user.channel.update(
            req.userInfo.userId, userTv)
    #endif
    if res['status'] != 200:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
    #endif

    #update tvTips settings
    if tvTipDisabled != req.userInfo.tvTipDisabled:
        try:
            res = req.config.frog.proxy.user.setAttributes(req.userInfo.userId, {"tvTipDisabled":fastrpc.Boolean(tvTipDisabled)})
        except:
            pass
#enddef


def jsSetupTvProcess(req):
    """Nastavi predvolene TV stanice
    """

    dataRoot = req.config.teng.createDataRoot({})

    # ulozit data
    try:
        setupTvCore(req)
    except:
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else:
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_setupTv.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def setupTvProcess(req):
    """Nastavi predvolene TV stanice
    """

    # ulozit data
    setupTvCore(req)

    # redirekt
    return lib_util.redir(req, '/nastaveni-tv-programu?saved=1')
#enddef


def setupWeatherScreen(req):
    """
    Volba nastaveni regionu pro pocasi
    """

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # standardni flagy na strance
    lib_util.addScreenFlags(req.form.get, dataRoot)

###    # zjistime nastaveny region
###    region = ''
###    feedList = req.userInfo.listFeeds()
###    for feed in feedList:
###        pom = req.config.feeds.weatherMapping[0].get(feed['feedId'], '')
###        if pom:
###            region = pom
###            break
###        #endif
###    #endfor
###
###    # pridame kraje
###    countyFragments = {}
###    for (k,v) in lib_uiradr.county.items():
###        countyFragments[k] = dataRoot.addFragment('county', {'name' : v, 'id' : k})
###    #endfor
###
###    # pridame vsechny okresy do kraju
###    districtFragments = {}
###    for (k,v) in lib_uiradr.district.items():
###        districtFragments[k] = countyFragments[v[1]].addFragment('district', {
###                'region' : k,
###                'name'   : v[0]
###                })
###
###        if region == k:
###            districtFragments[k].addVariable('selected', 1)
###            countyFragments[v[1]].addVariable('selected', 1)
###        #endif
###    #endfor

    countyId = req.form.get.getfirst("countyId", str, "")

    weather = req.userInfo.weatherFeedId
    if countyId:
        region = countyId
    elif req.config.feeds.weatherMapping[0].has_key(weather):
        region = req.config.feeds.weatherMapping[0][weather]
    else:
        region = "CZ0000"
    #endif

    for k, v in lib_uiradr.countyCodes.iteritems():
        if region == k or region[:-1] == k:
            selected = 1
        else:
            selected = 0
        #endif
        countyFragment = {"id"       : k,
                          "name"     : v["name"],
                          "selected" : selected}
        if selected:
            districts = []
            for district in lib_uiradr.countyCodes[k]["districts"]:
                if len(region) != len(district):
                    if len(districts):
                        selected = 0
                    else:
                        selected = 1
                    #endif
                else:
                    if region == district:
                        selected = 1
                    else:
                        selected = 0
                    #endif
                #endif
                districts.append({"id"       : district,
                                  "name"     : lib_uiradr.district[district][0],
                                  "selected" : selected})
            #endfor
            countyFragment["district"] = districts
        #endif
        dataRoot.addFragment('county', countyFragment)
    #endif

#    # ziskame RSS zdroje uzivatele, ze kterych vytahneme nastaveny horoskop
#    feedList = req.userInfo.listFeeds()
#    for feed in feedList:
#        v = req.config.feeds.weatherMapping[0].get(feed['feedId'], '')
#        if v:
#            try:
#                districtFragments[v].addVariable('selected', 1)
#                countyFragments[v].addVariable('selected', 1)
#                break
#            except KeyError, e:
#                # v mapovani je neco, co nemame v uiradr. Zalogujeme a jdeme dal
#                dbg.log('Bad weather mapping: %s', e, WARN=3)
#            #endtry
#        #endif
#    #endfor

    #
    # vypiseme stranku
    lib_util.generatePage(req, 'setup_weather.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def setupWeatherCore(req):
    """Nastavi uzivateli feed pocasi podle mesta
    """

    # pro jake mesto chceme pocasi
    districtId = req.form.post.getfirst("districtId", str)

    # data root
    dataRoot = req.config.teng.createDataRoot({})

    # id mesta prevedeme na id feedu
    feedId = req.config.feeds.weatherMapping[1].get(districtId, 0)

    dbg.log("Weather feed id `%s'", feedId, INFO = 4)

    # pokud se nastaveni zmenilo
    if feedId != req.userInfo.weatherFeedId:#TODO and feedId != 0:
        req.userInfo.weatherFeedId = feedId
        req.userInfo.setAttributes(req)
    #endif
    return feedId or 99
#enddef


def setupWeatherProcess(req):
    """Nastavi uzivateli feed pocasi podle mesta
    """
    setupWeatherCore(req)

    return lib_util.redir(req, '/nastaveni-pocasi?saved=1')
#enddef


def jsSetupWeatherProcess(req):
    """Nastavi uzivateli feed pocasi podle mesta
    """
    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    feedId = setupWeatherCore(req)

    # sleep kvuli replikaci
    sleep(1)

    # vratime obsah feedu
    res = req.config.frog.proxy.feed.getContent(feedId,
            req.config.feeds.outageUrl)
    if res['status'] != 200:
        dataRoot.addFragment("result", {
            "status" : 500,
            "statusMessage" : "internal_error"
        })
    else:
        dataRoot.addFragment("result", res)
    #endif

    # generuj stranku
    lib_util.generatePage(
        req,
        "js_setupWeather.js",
        dataRoot,
        req.config.template.defaultLanguage,
        contentType = 'text/html',
        responseContentType = 'application/x-javascript; charset=utf-8'
    )

    return apache.OK
#enddef


def jsFeedGetContent(req):
    return jsSetupFeedProcessCore(req, onlyGetContent = True)
#enddef


def jsSetupFeedProcess(req):
    return jsSetupFeedProcessCore(req, onlyGetContent = False)
#enddef


def jsSetupFeedProcessCore(req, onlyGetContent = False):
    """Ulozi nastaveni vlastnosti feedu
    """

    # url attributy

    feedId = req.form.post.getfirst("feedId", int)
    catId = req.form.post.getfirst("catId", str, '0')

    if not onlyGetContent:
        rowCount = req.form.post.getfirst("rowCount", int)
        showPreview = req.form.post.getfirst("showPreview", int)
        username = req.form.post.getfirst("username", str, "")
        password = req.form.post.getfirst("password", str, "")
    #endif

    # data root
    dataRoot = req.config.teng.createDataRoot({})

    # nastaveni
    try :
        if not onlyGetContent:
            feedAttributes = {
                "showPreview" : fastrpc.Boolean(showPreview),
                "rowCount"    : rowCount,
                "username"    : username,
            }

            if password:
                encrypted = req.config.foreignEmail.cipherer.encrypt(password)
                feedAttributes["password"] = encrypted
            #endif

            req.userInfo.feedSetAttributes(feedId, feedAttributes)
        #endif
    except :
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else:
        try:


            # a vytahnu informace o upravenem feedu
            res = req.config.frog.proxy.feed.getContentList([feedId],
                    req.config.feeds.outageUrl)

            if res['status'] / 100 != 2:
                raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
            #endif

        except:
            dataRoot.addFragment("result", {"status" : 500,
                                            "statusMessage" : "internal_error"})

        else:
            dataRoot.addFragment("result", {"status" : 200,
                                            "statusMessage" : "ok"})
            dataRoot.addVariable('userId', req.userInfo.userId)

            feedAttributes = res["feeds"][0]

            # do odpovedi pridej maily,
            # pokud to je email
            if feedAttributes.has_key("emailId"):
                feedAttributes["items"] = \
                    req.userInfo.listEmails(feedAttributes["emailId"])[1]
                for item in feedAttributes["items"]:
                    item["sentDate"] = item["sentDate"].unixTime
                #endfor
            #endif

            res = req.config.frog.proxy.user.feed.getAttributes(req.userInfo.userId,
                                                                feedId)
            if res['status'] / 100 != 2:
                raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
            #endif

            rowCount = res["feedAttributes"]["rowCount"]

            if feedId == 1051:
                # Super.cz - A/B test
                lib_util.prepare_stream_feed(req, feedAttributes)
            #endif

            if 194 == feedId:
                # Pre Stream Gadget vratime len polozky pre pozadovanu kategoriu
                rcount = rowCount
                streamItems = []
                i = 0
                for item in feedAttributes['items']:
                    if str(item['cat_id']) == catId:
                        item['icon_id'] = str(i)
                        streamItems.append(item)
                        rcount -= 1
                    i += 1
                    if not rcount:
                        break
                feedAttributes['items'] = streamItems
            elif len(feedAttributes["items"]) > rowCount:
                feedAttributes["items"] = feedAttributes["items"][:rowCount]
            #endif

            for key, value in res["feedAttributes"].iteritems():
                if not feedAttributes.has_key(key):
                    feedAttributes[key] = value
                #endif
            #endfor

            dataRoot.addFragment("feedAttributes", feedAttributes)
        #endtry
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_setupFeed.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def jsSetupFacebookProcess(req):
    uid = req.form.post.getfirst("uid", str, "")
    sessionId = req.form.post.getfirst("sessionId", str, "")
    rowCount = req.form.post.getfirst("rowCount", int, -1)
    showPicture = req.form.post.getfirst("showPicture", int, -1)

    dataRoot = req.config.teng.createDataRoot({})

    attributes = {}

    if uid:
        attributes["uid"] = uid
    if sessionId:
        attributes["sessionId"] = sessionId
    if rowCount != -1:
        attributes["rowCount"] = rowCount
    if showPicture != -1:
        attributes["showPicture"] = showPicture
    #endallifs

    try:
        req.userInfo.setFacebookAttributes(attributes)
        newAttrs = req.userInfo.getFacebookAttributes()
        dataRoot.addFragment("attributes", newAttrs)
        dataRoot.addFragment("result", {"status" : 200, "statusMessage" : "ok"})
    except Exception, e:
        dbg.log("Exception: %s" % str(e), ERR = 3)
        dataRoot.addFragment("result", {"status" : 500, "statusMessage" : "internal_error"})
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_setupFacebook.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def jsSetupEmailProcess(req):

    # url attributy
    emailCount = req.form.post.getfirst("emailCount", int)

    # data root
    dataRoot = req.config.teng.createDataRoot({})

    # nastaveni
    try :
        req.userInfo.emailCount = emailCount
        req.userInfo.setAttributes(req)
    except :
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else:
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_setupEmail.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK

#enddef


def jsForeignEmailLogout(req):
    """
    Odhlasi uzivatele z emailoveho uctu tretich stran.
    """

    # data root
    dataRoot = req.config.teng.createDataRoot({})

    try:
        emailId = req.form.post.getfirst("emailId", int)
        keepLogin = req.form.post.getfirst("keepLogin", bool, False)
    except:
        dataRoot.addFragment("result", {
            "status" : 400,
            "statusMessage" : "bad_request"
        })
    else:
        dataRoot.addFragment("result",
            req.userInfo.foreignEmailLogout(emailId, keepLogin))
    #endtry

    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
        req.config.template.defaultLanguage, contentType = 'text/html',
        responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def setupFeedScreen(req):
    """Screen s nastavenim RSS zdroju
    """
    groupId = req.form.get.getfirst("groupId", str, "seznam")

    dataRoot = req.userInfo.createDataRoot()

    dataRoot.addVariable('movie', req.form.get.getfirst('movie', str, ''))

    if req.form.get.getfirst('badSource', default = ''):
        dataRoot.addFragment('badSource', {})
        # pridame url zdroju
        for url in req.form.get.getlist('addrss'):
            dataRoot.addFragment('addrss', {'url' : url})
        #endfor
    #endif

    # standardni flagy na strance
    lib_util.addScreenFlags(req.form.get, dataRoot)

    # vylistujeme vsechny viditelne skupiny
    res = req.config.frog.proxy.feed.listGroups(fastrpc.Boolean(0))
    if res['status'] / 100 != 2:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
    #endif

    # vylistuje feedy pro uzivatele
    feeds = req.userInfo.listFeeds()
    feedsIds = []
    for feed in feeds:
        feedsIds.append(feed["feedId"])
    #endfor

    groups = res["groups"]
    groupsIds = []
    for group in groups:
        groupsIds.append(group["groupId"])
    #endfor

    # vylistujeme vsechny ostatni feedy
    res = req.config.frog.proxy.listFeeds(groupsIds)
    if res['status'] / 100 != 2:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
    #endif
    allFeeds = res["feeds"]

    # hledame skupinu, ke ktere budeme pridavat feedy
    for group in groups:

        group["selected"] = 0
        if groupId == group["groupId"] :
            group["selected"] = 1
        #endif

        groupFrag = dataRoot.addFragment("group", group)

        for feed in allFeeds :
            # do spravne skupiny
            if feed["groupId"] == group["groupId"] :
                feed["feedId"] = _convertMappings(feed["feedId"], req)
                feed["selected"] = 0
                # oznacime vybrane
                if feed["feedId"] in feedsIds:
                    feed["selected"] = 1
                elif feed['groupId'] == 'user':
                    # "user" feedy, ktore nemam vybrane sa nebudu zobrazovat, viz ticket #97
                    continue
                #endif
                groupFrag.addFragment("feed", feed)
            #endif
        #endfor
    #endfor


    # vypiseme stranku
    lib_util.generatePage(req, 'setup_feed.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def setupFeedProcess(req):
    """
    Ulozi seznam zdroju uzivatele
    """

    # seznam zdroju, ktere si uzivatel preje nastavit - vyber checkboxem
    wantList = req.form.post.getlist('feedId', int)
    groupId = req.form.post.getfirst('groupId', str, 'seznam')

    # seznam novych zdroju
    url = req.form.post.getfirst('addrss')

    req.userInfo.feedUpdate([{"feedId"      : x,
                              "showPreview" : fastrpc.Boolean(0),
                              "rowCount"    : 5} for x in wantList])

    # nyni mame url, ktera ma byt rss
    # Nejdrive na ni provedeme bezne testy
    badUrlList = ''
    if url != "http://":
        if not lib_util.checkSource(req, url):
            badUrlList += '&addrss=%s' % urllib.quote_plus(url)
            badUrlList += '&badSource=1'
        else:
            # takze url vypada jakz takz rozumne, zkusime na ni feed discovery
            # Vrati se nam bud jeden feed, nebo vice feedu podle toho se rozhodneme
            # co bude.
            try:
                feeds = lib_rss.check(req, url)
            except lib.error.ResponseIsTooBig:
                feeds = []
            #endtry

            #dbg.log("FEEDS: %s", (feeds), DBG=4)

            if len(feeds) == 0:
                badUrlList += '&addrss=%s' % urllib.quote_plus(url)
                badUrlList += "&badSource=1"
            elif len(feeds) == 1:
                dbg.log("Found only one rss channel: %s", (feeds[0]["href"]), INFO = 1)

                # pridame url do databaze
                res = req.config.frog.proxy.feed.create(feeds[0]["title"].encode("utf-8"),
                        feeds[0]["href"], req.config.control.userGroupId, { 'typeId' : 'rss' })
                if res['status'] not in [200, 201]:
                    raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
                #endif

                feedId = res['feedId']

                # pridame zdroj do uzivatelova seznamu
                res = req.config.frog.proxy.user.feed.add(req.userInfo.userId, {
                    "feedId"      : feedId,
                    "showPreview" : fastrpc.Boolean(0),
                    "rowCount"    : 5,
                    "column"      : 0})
                if res['status'] not in [200, 201]:
                    raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
                #endif
            else:
                dbg.log("Found %d feeds. User should choose on of them", (len(feeds)), INFO = 1)
                args = "a=1"
                for feed in feeds:
                    args += "&url=%s&title=%s" % (urllib.quote_plus(feed["href"]),
                            urllib.quote_plus(feed["title"].encode("utf-8")))
                #endfor
                return lib_util.redir(req, '/vyber-zprav?%s' % (args))
            #endif
        #endif
    #endif

    return lib_util.redir(req, '/nastaveni-zprav?saved=1%s&groupId=%s' % (badUrlList, groupId))
#enddef


def jsFeedSearch(req):
    """Pokusi se pridat novy feed uzivateli
    """

    url = req.form.post.getfirst("url")

    # data root
    dataRoot = req.config.teng.createDataRoot({})

    # nyni mame url, ktera ma byt rss
    # Nejdrive na ni provedeme bezne testy
    #if url.find("http://") != 0 :
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "http://%s" % url
    #endif

    try:

        #
        if url != "http://":

            list = False

            check = lib_util.checkSource(req, url)
            if check:
                # takze url vypada jakz takz rozumne, zkusime na ni feed discovery
                # Vrati se nam bud jeden feed, nebo vice feedu podle toho se rozhodneme
                # co bude.
                feeds = lib_rss.check(req, url)
            else:
                feeds = []
            #endif

            if len(feeds) > 1:
                feeds = feeds[:1]
            #endif

            dbg.log("FEEDS: %s", (feeds), INFO=4)
            if len(feeds) == 0:

                protocol = "http://" if url.startswith("http://") else "https://"
                url = url[len(protocol):]

                res = req.config.frog.proxy.feed.search(url)
                if res['status'] != 200:
                    raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
                #endif

                dbg.log("FEEDS: %s", (res), INFO=4)

                # Nacpeme nalezene feedy do resultu
                for feed in res["results"]:
                    if type(feed["title"]) == type(""):
                        feed["title"] = unicode(feed["title"], "utf-8")
                    #endif
                    feeds.append({"id": feed["id"],
                                  "groupId": feed["groupId"],
                                  "href": feed["url"],
                                  "title": feed["title"]})
                #endfor
                dbg.log("FEEDS: %s", (res), INFO=4)
                list = True

            elif len(feeds) == 1:
                dbg.log("Found only one rss channel: %s", (feeds[0]["href"]), INFO=1)

                # pridame url do databaze
                res = req.config.frog.proxy.feed.create(
                    feeds[0]["title"].encode("utf-8"),
                    feeds[0]["href"], req.config.control.userGroupId,
                    {'typeId': 'rss'})

                if res['status'] not in [200, 201]:
                    raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
                #endif

                feedId = res['feedId']

                feedAttributes = {
                    "feedId": feedId,
                    "column": 0,
                    "showPreview": fastrpc.Boolean(0)}
                # pridame zdroj do uzivatelova seznamu
                res = req.config.frog.proxy.user.feed.add(
                    req.userInfo.userId, feedAttributes)
                if res['status'] not in [200, 201]:
                    raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
                #endif

                res = req.config.frog.proxy.feed.getAttributes(feedId)
                if res["status"] != 200:
                    raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
                #endif

                for key, value in res["feedAttributes"].iteritems():
                    if not feedAttributes.has_key(key):
                        feedAttributes[key] = value
                    #endif
                #endif

                dataRoot.addFragment("addfeed", feedAttributes)
            #endif

            if list:
                feedsFrag = dataRoot.addFragment("feeds", {})
                for feed in feeds:
                    feedsFrag.addFragment("feed", feed)
                #endfor
            #endif
        #endif

    except lib.error.ResponseIsTooBig:
        feeds = []
        dataRoot.addFragment("result", {"status": 413,
                             "statusMessage": "response_too_big"})

    except:
        dbg.log("RSS Feed Exception: %s", lib_error.getExceptionString(), ERR=4)
        dataRoot.addFragment("feeds", {})
        dataRoot.addFragment("result", {"status": 500,
                                        "statusMessage": "internal_error"})
    else:
        dataRoot.addFragment("result", {"status": 200,
                                        "statusMessage": "ok"})
    #endif

    # generuj stranku
    lib_util.generatePage(req, 'js_feedSearch.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType='text/html',
                          responseContentType='application/x-javascript; charset=utf-8')

    return apache.OK

#enddef


def setupFeedDiscoveryScreen(req):
    """
    Screen s moznosti si vybrat z vice RSS zdroju nalezenych pomoci Discovery
    """
    urllist = req.form.get.getlist('url')
    titlelist = req.form.get.getlist('title')

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # pridame url nalezenych zdroju

    for i in range(0, len(urllist)):
        if i < len(titlelist):
            title = titlelist[i]
        else:
            title = urllist[i]
        #endif

        dataRoot.addFragment("url", {
                "url": urllist[i],
                "title": title
                })
    #endfor

    # standardni flagy na strance
    lib_util.addScreenFlags(req.form.get, dataRoot)

    # vypiseme stranku
    lib_util.generatePage(req, 'setup_discovery_feed.html',
        dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def setupFeedDiscoveryProcess(req):
    """
    Ulozi seznam zdroju uzivatele
    """

    for url in req.form.post.getlist('url'):

        dbg.log("Add feed: %s", (url), INFO = 1)

        # pridame url do databaze
        res = req.config.frog.proxy.feed.create('', url,
                req.config.control.userGroupId, { 'typeId' : 'rss' })
        if res['status'] not in [200, 201]:
            raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
        #endif

        feedId = res['feedId']

        # pridame zdroj do uzivatelova seznamu
        res = req.config.frog.proxy.user.feed.add(req.userInfo.userId, feedId)
        if res['status'] not in [200, 201]:
            raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
        #endif
    #endfor

    return lib_util.redir(req, '/nastaveni-zprav?saved=1')
#enddef


def setupOtherScreen(req):
    """
    Ostatni nastaveni
    """

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # standardni flagy na strance
    lib_util.addScreenFlags(req.form.get, dataRoot)

    # vypiseme stranku
    lib_util.generatePage(req, 'setup_other.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def setupOtherCore(req):
    """Ostatni nastaveni
    """
    # url atributy
    showEmail = req.form.post.getfirst("showEmail", int, -1)
    emailCount = req.form.post.getfirst("emailCount", int, 0)
    columns = req.form.post.getfirst("columns", int, 0)

    options = {}

    # add emailCount if present
    if showEmail != -1:
        if showEmail and req.userInfo.emailCount <= 0:
            options["emailCount"] = 10
        elif not showEmail and req.userInfo.emailCount > 0:
            options["emailCount"] = 0
        #endif
    #endif

    if emailCount:
        options["emailCount"] = emailCount
    #endif

    if columns:
        options["columns"] = columns
    #endif

    if options:
        #dbg.log("OPTIONS:%s", options, INFO = 4)
        res = req.config.frog.proxy.user.setAttributes(
            req.userInfo.userId, options)
        if res['status'] != 200:
            raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
        # pro jistotu pockame aby probehla v poradku replikace
        else:
            sleep(2)
        #endif
#enddef


def setupSuggest(req):
    """Nastavit suggest
    """
    # url atributy
    suggest = req.form.post.getfirst("suggest", int, 0)

    options = {
        "suggest": fastrpc.Boolean(suggest)}

    res = req.config.frog.proxy.user.setAttributes(
        req.userInfo.userId, options)
    if res['status'] != 200:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
    #endif

#enddef


def jsSetupOtherProcess(req):
    """Ostatni nastaveni
    """

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # zavola hlavni metodu
    try:
        setupOtherCore(req)
    except:
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else:
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')
    return apache.OK
#enddef


def jsSetupSuggest(req):
    """Nastaveni suggestu
    """

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # zavola hlavni metodu
    try:
        setupSuggest(req)
    except:
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else:
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')
    return apache.OK
#enddef


def setupOtherProcess(req):
    """Ostatni nastaveni
    """

    # zavola hlavni metodu
    setupOtherCore(req)

    # redirect
    return lib_util.redir(req, '/nastaveni-ostatni?saved=1')
#enddef


def setupSkinScreen(req):
    """
    Nastaveni skinu
    """

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # standardni flagy na strance
    lib_util.addScreenFlags(req.form.get, dataRoot)

    # vypiseme stranku
    lib_util.generatePage(req, 'setup_skin.html', dataRoot, req.userInfo.language)

    return apache.OK
#enddef


def setupSkinCore(req):
    """Nastaveni skinu - proces
    """

    skin = req.form.post.getfirst('skin', int, default = 0)
    externalSkin = ''#req.form.post.getfirst('externalSkin', default='')

    res = req.config.frog.proxy.user.setAttributes(req.userInfo.userId, {
                        "skin"         : skin,
                        "externalSkin" : externalSkin })
    if res['status'] != 200:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
    #endif
#enddef


def setupSkinProcess(req):
    """
    Nastaveni skinu - proces
    """

    # zavolani zmenny skinu
    setupSkinCore(req)

    # presmerovat
    return lib_util.redir(req, '/zmena-vzhledu?saved=1')
#enddef


def jsSetupSkinProcess(req):
    """
    Nastaveni skinu - proces
    """
    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # zavolani zmenny skinu
    try:
        setupSkinCore(req)
    except:
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else:
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')
    return apache.OK
#enddef


def addSearches(req, searches, dataRoot):
    """Prida informace o hledacich sluzbach
    """

    searchFrag = dataRoot.addFragment("searches", {})
    for search in searches:
        search["serviceUrl"] = "http://%s" % search["url"].split("://")[1].split("/")[0]
        searchFrag.addFragment("search", search)
    #endfor

#enddef


def jsSearchAdd(req):
    """Prida nove hledani
    """
    url = req.form.post.getfirst("url", str).strip(" ")
    title = req.form.post.getfirst("title", str).strip(" ")
    encoding = req.form.post.getfirst("encoding", str, "utf-8")

    url = lib_util.getFirstLine(url)

    # data root
    dataRoot = req.config.teng.createDataRoot({})

    try :

        if not title:
            raise ValueError("empty_title")
        #endif

        if len(title.decode("utf8")) > req.config.searchServices.maxTitleLength:
            raise ValueError("too_long_title")
        #endif

        try:
            # pokud v url neni na zacatku http://, pridame ho
            if url.find("http://") != 0:
                url = "http://%s" % url
            #endif

            dbg.log("Trying url: %s", url, INFO = 2)

            # zkusime hledat na danem url query 'test'
            # pokud to nevyhodi vyjimku, je url ok
            lib_httpproxy.get(url % "test", None, None, None, req.config)
        except:
            dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
            raise ValueError("invalid_url")
        #endtry

        # zjistime, zda uz neco ma
        res = req.userInfo.listSearch()

        # zkontrolujeme, ze jich nema moc
        userSearchCount = len(filter(lambda x: x["groupId"] == "user", res))
        if userSearchCount >= req.config.searchServices.maxUserItems:
            dbg.log("User already has %s user search services, not adding",
                    userSearchCount, INFO = 3)
            raise ValueError("too_much_search_services")
        #endif

        list = []
        # pokud nic nema je treba uzivateli nalit s novym
        # search vsechny defaultni
        if not len(res):
            res = req.config.frog.proxy.search.getContentList(
                req.config.searchServices.defaults)
            list = res["search"]
        #endif

        # nove zakladane hledani
        searchAttributes = {
            "title"       : title,
            "description" : "",
            "groupId"     : "user",
            "url"         : url,
            "isHidden"    : fastrpc.Boolean(0),
            "encoding"    : encoding
        }

        # pripojime k ostatnim
        list.append(searchAttributes)

        # zalozime nove (multicall)
        req.userInfo.searchesCreate(list)

        # vylistujeme aktualni stav hledacich sluzeb
        # musim listovat znova k vuli nove zalozenemu id
        searches = req.userInfo.listSearch()

        # prida fragment aktualniho stavu hledani
        addSearches(req, searches, dataRoot)

    except ValueError, e:
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status"        : 401,
                                        "statusMessage" : e.args[0]})
    except :
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else:
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_searchAdd.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def setupSearchCore(req):
    """Nastaveni hledacich url
    """

    # parametry z url
    ids = req.form.post.getfirst('id', str)
    isHidden = req.form.post.getfirst('isHidden', str)

    # parametry z requestu (prevedeme na list<int>)
    # ids idecka uzivatelkych searchu
    ids = map(int, ids.split(","))
    isHidden = map(int, isHidden.split(","))

    if len(ids) != len(isHidden):
        return False, "count_mismatch"
    #endif

    # zkontrolovat, ze jich nezobrazujeme moc
    visible = filter(lambda x: not x, isHidden)
    if len(visible) > req.config.searchServices.maxVisibleItems:
        return False, "too_much_visible"
    #endif

    # kontrolujeme, zda se neco zmenilo, pokud se najde 0
    # nebo se rovna to co prislo a default
    # namapujeme uzivateli default
    foundChange = True
    try : isHidden.index(0)
    except : foundChange = False

    # nic se nezmenilo
    if ids == req.config.searchServices.defaults and not foundChange:
        return False, ""
    #endif

    # neco se zmenilo, zjistime, zda uz neco ma
    searchs = req.userInfo.listSearch()

    # pokud nic nema je treba uzivateli nalit defaultni
    if not len(searchs):
        # sem se to muze dostat pouze pokud si nic nepridal
        # jenom zmenil isHidden vlastnosti, nahoda, nebo heck
        res = req.config.frog.proxy.search.getContentList(
            req.config.searchServices.defaults)
        list = res["search"]

        req.userInfo.searchesCreate(list)

        # znovu nacti
        search = req.userInfo.listSearch()
    else :
        # hledame fulltext id v uzivatelovych
        # hledanich, ten musi byt 1
        for search in searchs:
            if search["searchId"] == 1:
                # najdu prvek a nastavim natvrdo 0
                try :
                    isHidden[ids.index(search["userSearchId"])] = 0
                except:
                    # neni v seznamu, pridam
                    ids.append(1)
                    isHidden.append(0)
                #endtry
                break
            #else
                #dbg.log("User hasn't seznam fultext search service", WARN = 4)
            #endif
        #endfor
    #endif

    listSearch = []
    # atributy, ktere se budou nastavovat

    for i, h in zip(ids, isHidden):
        listSearch.append({
            "id"       : i,
            "isHidden" : fastrpc.Boolean(h)})
    #endfor

    dbg.log("Set list search: %s", listSearch, INFO = 1)
    req.userInfo.searchSet(listSearch)

    return True, ""
#enddef


def jsSetupSearchProcess(req):
    """Nastaveni search
    """
    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # zavolani ulozeni hledani
    status, error = setupSearchCore(req)

    if status :
        dataRoot.addFragment("result", {"status"        : 200,
                                        "statusMessage" : "ok"})
    else :
        dataRoot.addFragment("result", {"status"        : 500,
                                        "statusMessage" : error})
    #endif

    # generuj stranku
    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')
    return apache.OK
#enddef


def jsSearchList(req):
    """List search
    """
    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    try:

        # zjistime, zda uz neco ma
        searches = req.userInfo.listSearch()

        # pokud nic nema je treba uzivateli
        # nalit s novym search vsechny defaultni
        if not searches:
            defSearches = req.userInfo.defaultSearchList()
            req.userInfo.searchesCreate(defSearches)
            searches = req.userInfo.listSearch()
            if not searches:
                searches = defSearches
            #endif
        #endif

        # prida fragment aktualniho stavu hledani
        addSearches(req, searches, dataRoot)

    except:
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else:
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_searchList.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')
    return apache.OK
#enddef


def jsSearchReset(req):
    """Vymuluje uzivatelova hledani
    """
    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    try :
        req.userInfo.resetSearch()
    except:
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)

        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else :
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_confirm.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')
    return apache.OK
#enddef


def setDefaults(req):
    """Nastavi uzivateli defaulty (smaze ho)
    """

    hid = req.form.get.getfirst('hashId', default='')
    try:
        req.userInfo.verifyHashId(hid)
    except ValueError:
        dbg.log('Hash hid=%s does not match for user userId=%d', (hid, req.userInfo.userId), WARN=3)
        return lib_util.redir(req, '/')
    #endif

    dbg.log("Setting to default values", DBG=1)
    req.userInfo.setDefaults(req)

    # po resete nastaveni pockame 2 sekundy,
    # aby sa stihli zrepolikovat zmeny v db
    sleep(2)

    return lib_util.redir(req, '/')
#enddef


def getFeedListDataRoot(req, dataRoot, method = "POST"):

    # id skupiny
    if method == "POST":
        groupIds = req.form.post.getlist("groupId", str)
    elif method == "GET":
        groupIds = req.form.get.getlist("groupId", str)
    #endif

    #################################################################
    # Administrace RSS: zobrazeni aktualni nabidky RSS zdroju
    #################################################################
    res = { "status" : 500 }
    frogProxy = req.config.frog.proxy
    if "user" in groupIds:
        res = frogProxy.feed.listUserGroup(req.userInfo.userId)
    else:
        res = frogProxy.feed.listPublishedGroups(req.userInfo.userId)
    #endif
    if res['status'] / 100 != 2:
        raise lib_error.UnexpectedResponse(frogProxy, res)
    #endif

    for group in res["result"]["groups"]:
        groupDataRoot = dataRoot.addFragment("group", group)
        for feed in req.userInfo.filterFeeds(group["feeds"]):
            if feed["feedId"] == 179:
                dbg.log("FACEBOOK feed temporarily disabled, skipping")
                continue
            #endif
            groupDataRoot.addFragment("feed", feed)
        #endfor
    #endfor

    return
    #################################################################

    if not groupIds:
        groupIds = ('seznam',)
    #endif

    # vylistujeme vsechny viditelne skupiny
    res = req.config.frog.proxy.feed.listGroups(fastrpc.Boolean(0))
    if res['status'] / 100 != 2:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
    #endif

    # hladame skupiny, ku ktorym budeme pridavat feedy
    selectedGroupFrags = {}
    for group in res["groups"]:
        groupId = group["groupId"]
        if groupId in groupIds:
            selectedGroupFrags[groupId] = dataRoot.addFragment("group", group)
            continue
        #endif
        dataRoot.addFragment("group", group)
    #endfor

    # vylistuje feedy pro uzivatele
    feeds = req.userInfo.listFeeds()

    # vytvorime list s idecky feedy uzivatele
    userFeedIds = []
    for feed in feeds :
        # zapamatujeme si uzivatelske idecka
        userFeedIds.append(feed["feedId"])

        # do tengu posleme vsechny idecka, ktere uzivatel ma
        dataRoot.addFragment("userFeedIds", {"id" : feed["feedId"]})

        feed["feedId"] = _convertMappings(feed["feedId"], req)

    #endfor

    for groupId in groupIds:
        # listujeme systemove feedy

        if groupId != "user" :
            # vylistujeme feedy pro zadanou skupinu
            res = req.config.frog.proxy.listFeeds((groupId))
            if res['status'] / 100 != 2:
                raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
            #endif

            feeds = req.userInfo.filterFeeds(res['feeds'])
        #endif

        for feed in feeds:

            # pokud chceme listovat jen feedy uzivatele
            # vyhazeme vsechny ostatni
            if groupId == "user" and feed["groupId" ] != "user":
                continue
            #endif

            feed["selected"] = 0
            if feed["feedId"] == 179:
                dbg.log("FACEBOOK feed temporarily disabled, skipping")
                continue

            if feed["feedId"] in userFeedIds:
                feed["selected"] = 1
            #endif

            selectedGroupFrags[groupId].addFragment("feed", feed)
        #endfor
    #endfor
#enddef


def jsGetFeedList(req):
    """Vylistuje seznam skupin feedu a v nich feedy
    """

    # data root
    #dataRoot = req.config.teng.createDataRoot({})
    dataRoot = req.userInfo.createDataRoot()
    try:
        getFeedListDataRoot(req, dataRoot)
    except :
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)
        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else :
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endtry

    # generuj stranku
    lib_util.generatePage(req, 'js_feedList.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK
#enddef


def setByOther(req):

    newUserId = req.form.post.getfirst("newUserId", int)

    if req.config.control.setByOtherIds:
        if newUserId not in req.config.control.setByOtherIds :
            req.content_type = 'text/html'
            req.write('Nastavení tohoto uživatele nemůžete zkopírovat :)')
            return apache.OK
        #endif
    #endif

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    try :
        req.userInfo.setByOther(newUserId)
    except:
        dbg.log("Exception: %s", lib_error.getExceptionString(), ERR = 4)

        dataRoot.addFragment("result", {"status" : 500,
                                        "statusMessage" : "internal_error"})
    else :
        dataRoot.addFragment("result", {"status" : 200,
                                        "statusMessage" : "ok"})
    #endtry

    sleep(req.config.control.setByOtherDelay)

    return lib_util.redir(req, '/')
#enddef
