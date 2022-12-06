#/bin/env python2.2
#coding utf-8
# $Id$
"""
DESCRIPTION   Logged info
"""

from dbglog     import dbg
from time       import sleep, time
from defaultinfo   import DefaultInfo, AuthorizationException
from cookiecacher import CookieCacher
import calendar
import fastrpc


class LoggedInfo(DefaultInfo):
    """
    Trida zpristupnujici data prihlaseneho uzivatele
    """

    def __init__(self, req, checkHashId=True):
        """
        Inicializuje objekt prihlaseneho uzivatele.
        """

        dbg.log("LOGGED initing", DBG=1)

        # inicializuje defaultni hodnoty
        DefaultInfo.__init__(self, req)

        # zakladni nastaveni
        self.loggedUser = True

        self.commericial_feed = 94888

        self.__checkSession(req)

        if not self.userId:
            raise AuthorizationException

        if checkHashId:
            try:
                hashId = req.form.post.getfirst("hashId")
            except KeyError:
                hashId = req.form.get.getfirst("hashId")

            try:
                self.verifyHashId(hashId)
            except ValueError:
                raise AuthorizationException
            #endtry
        #endif

        #generate new hashId
        self.hashId = lib_util.idToHash(self.userId)

        # vybere atributy uzivatele z uboxu
        self.__getUboxAttributes(req)

        # vybere attributy uzivatele z frogu
        self.__getHPAttributes(req)

        # vybere attributy z tv serveru
        self.__getTVAttributes(req)

        skinMap = {1:19, 11:21, 9:22, 8:24, 14:20, 4:21, 5:12, 6:23, 7:23, 2:1, 3:19}

        if not self.skinCustom and not self.skinId and self.skin:
            self.skinId = skinMap.get(self.skin, 0)

        self.skin = 0

        # if we came from login server and we have authenticated session then remember last_login timestamp
        logged = req.form.get.getfirst("logged", int, 0)
        if logged > 0:
            res = self.config.ubox.proxy.getServiceMapping(self.userId, 'homepage')
            if res['status'] / 100 == 2:
                try:
                    self.last_login = int(res['lastUsed'].unixTime)
                except:
                    self.last_login = int(time())
                    pass
                dbg.log("adding last_login = %s" % self.last_login, DBG = 1)
    #enddef

    def __getUboxAttributes(self, req):
        """ Vybere attributy uzivatele z uboxu
        """

        # zjistime udaje o uzivateli
        res = self.config.ubox.proxy.user.getAttributes(self.userId, (
                "sex", "birthDate", "language", "portrait", "greeting"))
        if res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.ubox.proxy, res)
        #endif

        self.username = res['userData']['username']
        self.domain = res['userData']['domain']
        self.sex = res['userData']['sex']
        self.language = lib_util.validateLanguage(req, res['userData']['language'])
        self.portraitUrl = res['userData']['portraitUrl']
        self.greeting = res['userData']['greeting']


        # vypocita vek, je-li zadan
        bd = res['userData']['birthDate']
        if bd.year:
            thisDate = fastrpc.LocalTime()
            self.age = thisDate.year - bd.year
            if bd.month > thisDate.month:
                self.age = self.age - 1
            else:
                if bd.day > thisDate.day:
                    self.age = self.age - 1
                #endif
            #endif
        #endif

        # zistime, ci pouziva user seznam email (t.j. ze ma namapovanu sluzbu email)
        res = self.config.ubox.proxy.getServiceMapping(self.userId, 'email')
        if res['status'] == 200:
            self.disabledEmail = res['disabled']
        elif res['status'] == 403:
            self.usingEmail = False
        else:
            # pri chybe na uboxe vypiseme len warning, nemusim zhadzovat celu homepage
            dbg.log("Can't get service mapping for userId=%d, result: %s", self.userId, str(res), ERR = 1)
        #endif
    #enddef


    def __getHPAttributes(self, req):
        """ Vybere attributy uzivatele ulozene na HP (frog)
        """

        # overime existenci uzivatele na Frog
        res = self.config.frog.proxy.user.getAttributes(self.userId, True)
        if res["status"] == 404:
            dbg.log("User userId=%d does not exist on Frog, "
                "creating it", self.userId, INFO = 3)

            # namapuj sluzbu uzivateli
            res = self.config.ubox.proxy.mapService(
                self.userId, self.config.control.serviceId)
            if res['status'] != 200:
                raise lib_error.UnexpectedResponse(self.config.ubox.proxy, res)
            #endif

            res = self.config.ubox.proxy.user.getAttributes(self.userId)
            if res["status"] != 200:
                raise lib_error.UnexpectedResponse(self.config.ubox.proxy, res)
            #endif

            try:
                birthDate = res["userData"]["birthDate"]
                self.zodiacFeedId = calendar.getZodiacByDate(birthDate.day, birthDate.month)
            except:
                self.zodiacFeedId = 185
            #endtry

            res = self.config.frog.proxy.user.create(self.userId, {
                "username"      : self.username,
                "domain"        : self.domain,
                "suggest"       : fastrpc.Boolean(self.suggest),
                "friends"       : fastrpc.Boolean(self.friends),
                "hideCatalogue" : fastrpc.Boolean(self.hideCatalogue),
                "zodiacFeedId"  : self.zodiacFeedId,
                "weatherFeedId" : self.weatherFeedId,
                "selectedNote"  : 1,
                "columns"       : 2
            })
            if res['status'] not in [200, 404]:
                raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
            else:
                # cekame na replikaci master-slave
                sleep(2)
            #endif

            if self.domain not in self.config.control.availableDomains:
                # 184 je idecko emailoveho feedu
                feedsMap = dict((f["feedId"], f) for f \
                    in req.config.feeds.feedList if f["feedId"] != 184)
            else:
                feedsMap = dict((f["feedId"], f) for f \
                    in req.config.feeds.feedList)
            #endif

            # je treba uzivateli nalit vsechny defaultni feedy
            res = req.config.frog.proxy.feed.getContentList(feedsMap.keys())

            # musime doplnit column, row a rowCount
            for feed in res["feeds"]:
                feed.update(feedsMap[feed["feedId"]])
                feed["showPreview"] = fastrpc.Boolean(0)
            #endfor

            self.feedsCreate(sorted(res["feeds"],
                key = lambda x: (x["column"], x["row"])))

        elif res['status'] != 200:
            dbg.log('Failed to create user userId=%d: <%d, %s>',
                (self.userId, res['status'], res['statusMessage']), ERR = 3)
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)

        else:
            userAttributes = res["userAttributes"]
            # uzivatel existuje, zjistime vlastnosti
            self.suggest = int(userAttributes["suggest"])
            self.friends = int(userAttributes["friends"])
            self.hideCatalogue = int(userAttributes["hideCatalogue"])
            self.tvTipDisabled = int(userAttributes["tvTipDisabled"])
            self.skin = int(userAttributes["skin"])
            self.skinId = int(userAttributes["skinId"])
            self.skinCustom = userAttributes["skinCustom"]
            self.skinCustomOpacity = userAttributes["skinCustomOpacity"]
            self.externalSkin = userAttributes["externalSkin"]
            self.emailCount = userAttributes["emailCount"]
            #self.tvChannelId       = userAttributes["tvChannelId"]
            self.currencyId = userAttributes["currencyId"]
            self.zodiacFeedId = userAttributes["zodiacFeedId"]
            self.weatherFeedId = userAttributes["weatherFeedId"]
            self.selectedNote = userAttributes["selectedNote"]
            self.columns = userAttributes["columns"]
            self.regionGasId = userAttributes["regionGasId"]

            # we get dbconfig in user.GetAttributes rpc query
            for c in res["config"]:
                if c["key"] in ("hint_wait_delay", "hint_delete_delay"):
                    setattr(self, c["key"], int(c["value"]))
                    dbg.log("setting %s to %s", (c["key"], int(c["value"])), DBG = 1)
        #endif
    #enddef

    def __getTVAttributes(self, req):
        try:
            res = req.config.tvServer.proxy.hp.user.listChannels(self.userId)
            if res["status"] == 404:
                dbg.log("LOGGED TV user not found for user %s", self.userId, INFO = 3)
            elif res["status"] == 200:
                self.createdOnTvServer = True
                self.tvChannelId = res["channels"]
            else:
                dbg.log("LOGGED TV obtaining tv channels failed: %s", str(res), WARN = 2)
        except Exception, e:
            dbg.log("LOGGED TV obtaining tv channels failed: %s", str(e), WARN = 2)
        #endif
    #enddef

    def __checkSession(self, req):
        """provedeme overeni session uzivatele. V cookie mame mit DS (DurableSession)
        """

        try:
            session = lib_util.getDSCookie(req)
            self.session = session
            ua = req.headers_in.get('User-Agent', '')
            dbg.log("LOGGED Got session: %s, ua=%s", (self.session, ua), DBG=1)

            if len(self.session):
                res = self.config.sbox.proxy.session.check(self.session, {
                    'clientIp': self.inetInfo.ipForSBox,
                    'userAgent': ua,
                    'serviceId': self.config.control.serviceId})

                if res['status'] == 200:
                    self.userId = res['userId']
                    self.session = res['session']
                    self.temporary = int(res['temporary'])

                    dbg.log("LOGGED SESSION userId=%d session=%s temporary=%d", (self.userId, self.session, self.temporary), DBG=1)
                    lib_util.setDSCookie(req, self.session, not self.temporary)

                    # no hw cookie -> notice sbox ( hw cookie expires every 24
                    # hours)
                    if not lib_util.getHintWaitCookie(req):
                        try:
                            noticeRes = self.config.ubox.proxy.noticeActivity(
                                self.userId,
                                self.config.control.serviceId,
                                self.inetInfo.ipForSBox)
                            dbg.log("LOGGED UBOX FRPC noticeActivity response %s", str(noticeRes), DBG=1)
                        except Exception, e:
                            dbg.log("LOGGED UBOX FRPC noticeActivity failed %s", str(e), WARN=3)
                            pass

                elif res['status'] != 402:
                    dbg.log("LOGGED Failed to authorize user: <%d, %s>",
                            (res['status'], res['statusMessage']), WARN=3)
                else:
                    dbg.log("LOGGED Unauthorized access", DBG=1)
                #endif
            #endif

        except AttributeError, e:
            dbg.log("LOGGED Failed to parse cookies - Attribute error %s", str(e), ERR=3)
        #endtry
    #endtry

    def listFeeds(self):
        """Vrati seznam RSS zdroju daneho uzivatele
        """

        if self._feedList:
            return self._feedList

        res = self.config.frog.proxy.user.feed.list(self.userId)
        if res['status'] == 404:
            dbg.log('User userId=%d not found on frog server', self.userId, WARN = 3)
            return []
        elif res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif

        self._feedList = self.filterFeeds(res['feeds'])
        return self._feedList
    #enddef

    def filterFeeds(self, feeds):
        """
        Metoda urcena na precistenie zoznamu feedov
        od feedov, ktore uzivatel neuvidi.
        """

        if self.usingEmail:
            return feeds
        #endif

        f = []
        for feed in feeds:
            if feed['typeId'] != 'email':
                f.append(feed)
            #endif
        #endfor

        return f
    #enddef

    # TODO: vratit predchozi variantu teto metody po provedeni
    # maintenance skriptu `update-user-weather.py`
    #def filterFeeds(self, feeds):
    #    """
    #    Metoda urcena na precistenie zoznamu feedov
    #    od feedov, ktore uzivatel neuvidi
    #    """

    #    f = []

    #    if self.usingEmail:
    #        for feed in feeds:
    #            if feed['typeId'] != 'weather':
    #                f.append(feed)
    #            #endif
    #        #endfor
    #    else:
    #        for feed in feeds:
    #            if feed['typeId'] not in ('email', 'weather'):
    #                f.append(feed)
    #            #endif
    #        #endfor
    #    #endif

    #    return f
    ##enddef


    def listEmails(self, emailId):
        """Vrati seznam zprav pro daneho uzivatele a email
        """

        res = self.config.frog.proxy.user.email.getContent(self.userId, emailId)
        if res["status"] == 404:
            dbg.log("%s", res["statusMessage"], WARN = 3)
            return ({}, [],)
        elif res["status"] != 200:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif

        return (res["settings"], res["messages"],)
    #enddef


    def listSearch(self, isHidden = True):
        """Vrati seznam Searchu daneho uzivatele
        """

        fp = self.config.frog.proxy
        attr = {} if isHidden else {
            "isHidden" : fastrpc.Boolean(isHidden)
        }

        res = fp.user.listSearch(self.userId, attr)
        if res["status"] == 200:
            if not res["search"]:
                msgFmt = "User userId=%d does not have "\
                    "customised search list, using default."
                dbg.log(msgFmt, self.userId, INFO = 1)
            else:
                return res["search"]
            #endif
        elif res["status"] == 404:
            msgFmt = "User userId=%d not found on "\
                "frog server, using default search list."
            dbg.log(msgFmt, self.userId, WARN = 3)
        else:
            raise lib_error.UnexpectedResponse(fp, res)
        #endif

        return []
    #enddef


    def hasGadgetWithType(self, typeId, groupId):
        for feed in self.listFeeds():
            if typeId == feed['typeId'] and groupId == feed['groupId']:
                return True
        return False


    def getFacebookAttributes(self):
        """Vrati uzivatelovy parametry facebooku v dictionary
        """

        # Facebook feed je docasne vypnut. Pri obnoveni je zapotrebi
        # tabulce `user_facebook` pridat cizi klic na `user` (viz #525).
        # Vratime fragment s prazdnymi atributy.
        return {
            "rusUserId": self.userId,
            "uid": "",
            "sessionId": "",
            "rowCount": "",
            "showPicture": ""
        }

        dbg.log("Getting Facebook Attributes for User %s" % self.userId, INFO = 2)

        res = self.config.frog.proxy.user.facebook.getAttributes(self.userId)

        if res['status'] == 404:
            # vratime fragment s prazdnymi atributy
            # special dedication to the webmasters
            return {"rusUserId": self.userId,
                    "uid": "",
                    "sessionId": "",
                    "rowCount": "",
                    "showPicture": ""}
        elif res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
        dbg.log(" Facebook Attributes for User %s: %s" % (self.userId, str(res["attributes"])), INFO = 2)

        return res["attributes"]
    #enddef


    def setFacebookAttributes(self, attributes):
        """Vrati uzivatelovy parametry facebooku v dictionary
        """

        dbg.log("Setting Facebook Attributes for User %s" % self.userId, INFO = 3)
        dbg.log(" Facebook Attributes for User %s: %s" % (self.userId, str(attributes)), INFO = 2)

        attributes["rusUserId"] = self.userId

        res = self.config.frog.proxy.user.facebook.set(attributes)

        if res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
    #enddef


    def resetSearch(self):
        """Vynuluje hledani pro danneho uzivatel
        """

        res = self.config.frog.proxy.user.search.reset(self.userId)

        if res['status'] == 404:
            dbg.log('User userId=%d not found on frog server', self.userId, WARN = 3)
        elif res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
    #enddef


    def setDefaults(self, req):
        """Nastavi uzivateli defaultni hodnoty (tim, ze ho smaze)
        """
        try:
            # remove cached cookies
            ccache = CookieCacher(req.config.cookiecacher)
            ccache.removeUserValues(req)
            lib_util.setASCookie(req, 0, remember = False)
        except Exception, e:
            dbg.log("CCACHE removing cached cookies failed %s", str(e), WARN = 3)
            raise lib_error.Error(str(e))

        res = self.config.frog.proxy.user.remove(self.userId)

        if res["status"] == 404:
            dbg.log('User userId=%d not found on frog server', self.userId, WARN = 3)
        elif res["status"] != 200:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        elif self.skinCustom:
            try:
                req.config.repository.proxy.storagecontrol.noticeObjectsChange({
                    "templateName"   : "homepage-photo",
                    "objectName"     : "picture",
                    "rejectObjectId" : self.skinCustom
                })
            except fastrpc.Error, err:
                dbg.log("Ignoring FastRPC error: %s", err, WARN = 2)
            #endtry
        #endif
    #enddef


    def addFeed(self, feedAttributes):
        """Prida do databaze uzivatele novy feed
        """

        dbg.log("Adding feed: %s for userId: %d",
            (feedAttributes, self.userId), DBG = 1)
        res = self.config.frog.proxy.user.feed.add(self.userId, feedAttributes)
        if res['status'] not in [200, 201]:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
    #enddef


    def moveFeed(self, feedList):
        """Presune feedy
        """

        dbg.log("frog.user.feed.move(%s, %s)", (self.userId, feedList), INFO = 4)

        res = self.config.frog.proxy.user.feed.move(self.userId, feedList)
        if res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
    #enddef


    def removeFeed(self, feedId):
        """Odebere z databaze uzivatele zdroj
        """

        if feedId == self.commericial_feed:
            # reklamu nelze mazat
            return
        #endif

        dbg.log("Removing feedId=%d for userId=%d", (feedId, self.userId), DBG = 1)
        res = self.config.frog.proxy.user.feed.remove(self.userId, int(feedId))
        if res['status'] == 404:
            dbg.log("Cannot remove feedId=%d to userId=%d: <%d, %s>",
                (feedId, self.userId, res['status'], res['statusMessage']), INFO = 3)
        elif res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
    #enddef


    def removeFeeds(self, feeds):
        """Odebere z databaze uzivatele zdroj
        """

        dbg.log("Removing feeds %s from user %d", (feeds, self.userId), DBG = 1)
        multicallRequest = [{"methodName" : "user.feed.remove",
                             "params"     : [self.userId, x]} for x in feeds]
        results = self.config.frog.proxy.system.multicall(multicallRequest)
        for result in results:
            res = result[0]
            if res['status'] == 404:
                dbg.log("Cannot remove feeds %s from user %d: <%d, %s>",
                    (feeds, self.userId, res['status'], res['statusMessage']), INFO = 3)
            elif res['status'] != 200:
                raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
            #endif
        #endfor
    #enddef


    def feedSetAttributes(self, feedId, attributes):
        """Nastavi vlastnosti feedu
        """

        res = self.config.frog.proxy.user.feed.setAttributes(
                self.userId, feedId, attributes)

        if res['status'] / 100 != 2:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
    #enddef


    def feedGetAttributes(self, feedId):
        """Vrati vlastnosti feedu
        """

        res = self.config.frog.proxy.user.feed.getAttributes(
                self.userId, feedId)

        if res['status'] / 100 != 2:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif

        return res["feedAttributes"]
    #enddef


    def feedsCreate(self, list):
        """Zalozi vsechny feedy najednou multicallem
        """

        multicallReq = tuple({
            "methodName" : "user.feed.add",
            "params"     : (self.userId, x)
        } for x in list)

        results = self.config.frog.proxy.system.multicall(multicallReq)
        for result in results :
            res = result[0]
            if res['status'] / 100 != 2:
                dbg.log("Result %s", res, ERR = 2)
                raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
            #endif
        #endfor
    #enddef


    def feedUpdate(self, list):
        """Nastavi vlastnosti hledani
        """

        res = self.config.frog.proxy.user.feed.update(self.userId, list)
        dbg.log("%s %s", (self.userId, list), INFO = 4)
        dbg.log("%s", (res), INFO = 4)

        if res['status'] / 100 != 2:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
    #enddef


    def searchSet(self, listSearch):
        """Nastavi vlastnosti hledani
        """

        res = self.config.frog.proxy.user.search.set(
                self.userId, listSearch)

        if res['status'] / 100 != 2:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
    #enddef


    def searchCreate(self, searchAttributes):
        """Zalozi uzivateli nove hledani
        """

        res = self.config.frog.proxy.user.search.create(
                self.userId, searchAttributes)

        if res['status'] / 100 != 2:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
    #enddef


    def searchesCreate(self, list):
        """Zalozi searche vsechny najednou multicallem
        """

        multicallReq = [{
            "methodName" : "user.search.create",
            "params"     : [ self.userId, x ] } for x in list ]
        results = self.config.frog.proxy.system.multicall(multicallReq)
        for result in results :
            res = result[0]
            if res['status'] == 404:
                raise ValueError("already_added")
            elif res['status'] / 100 != 2:
                dbg.log("Result %s", res, ERR = 2)
                raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
            #endif
        #endfor
    #enddef


    def setAttributes(self, req):
        """Nastavi uzivateli vlastnosti
        """

        res = self.config.frog.proxy.user.setAttributes(self.userId, {
            "suggest"       : fastrpc.Boolean(self.suggest),
            "friends"       : fastrpc.Boolean(self.friends),
            "emailCount"    : self.emailCount,
            "zodiacFeedId"  : self.zodiacFeedId,
            "weatherFeedId" : self.weatherFeedId,
            "selectedNote"  : self.selectedNote,
            "columns"       : self.columns,
            "skinId"        : self.skinId,
            "skinCustom"    : self.skinCustom,
            "skinCustomOpacity"    : self.skinCustomOpacity,
        })
        if res['status'] == 404:
            dbg.log("User id=%d does not exist <%s, %s>",
                (self.userId, res['status'], res['statusMessage']), INFO = 3)
        elif res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
    #enddef

    def verifyHashId(self, hashId):
        """Overi, ze zadane hashId odpovida uzivatelovu hashId
        """

        if lib_util.idToHash(self.userId) != hashId:
            dbg.log("LOGGED HASHID SEC failed to validate hashId %s", str(hashId), DBG=1)
            raise ValueError, hashId
        #endif

        return True
    #enddef

    def getNote(self, note):
        res = self.config.ubox.proxy.user.note.get(self.userId, note)
        if res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.ubox.proxy, res)
        #endif

        return res["noteContent"].replace(u"\u2028", "\n").replace(u"\u2029", "\n"), res["hidden"]
    #enddef


    def getNotes(self):
        """
        Vrati seznam uzivatelovych poznamek
        """
        res = self.config.ubox.proxy.user.listNotes(self.userId, fastrpc.True)
        if res["status"] != 200:
            raise lib_error.UnexpectedResponse(self.config.ubox.proxy, res)
        #endif

        noteDict = dict((note["noteNumber"], {
            "noteNumber"  : note["noteNumber"],
            "noteAbstract": note["noteAbstract"].replace(u"\u2028", "\n") \
                                                .replace(u"\u2029", "\n"),
            "hidden"      : note["hidden"]
        }) for note in res["noteList"])

        noteList = []
        for noteNumber in xrange(1, self.config.control.noteCount + 1):
            noteList.append(noteDict.get(noteNumber, {
                "noteNumber"   : noteNumber,
                "noteAbstract" : "",
                "hidden"       : fastrpc.True
            }))
        #endfor

        return noteList
    #enddef


    def setNote(self, noteNumber, noteContent, hidden = 1):
        """
        Ulozi obsah poznamky.
        """
        res = self.config.ubox.proxy.user.note.set(self.userId,
                noteNumber, noteContent, fastrpc.Boolean(hidden))
        if res["status"] != 200:
            raise lib_error.UnexpectedResponse(self.config.ubox.proxy, res)
        #endif
    #enddef


    def setNoteVisibility(self, note, hidden = 1):
        res = self.config.ubox.proxy.user.note.setVisibility(
            self.userId, note, fastrpc.Boolean(hidden))

        if res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.ubox.proxy, res)
        #endif
    #enddef


    def removeNote(self, note):
        res = self.config.ubox.proxy.user.note.remove(self.userId, note)
        if res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.ubox.proxy, res)
        #endif
    #enddef


    def setByOther(self, newUserId):
        res = self.config.frog.proxy.user.setByOther(self.userId, newUserId)
        if res['status'] != 200:
            raise lib_error.UnexpectedResponse(self.config.frog.proxy, res)
        #endif
    #enddef

    def foreignEmailLogout(self, emailId, keepLogin):
        """
        Nastavi status emailoveho uctu tretich stran.
        """

        method = self.config.frog.proxy.user.email.logout
        try:
            res = method(self.userId, emailId, keepLogin)
            if res["status"] == 200:
                return { "status" : 200, "statusMessage" : "confirm" }
            #endif
        except:
            pass
        #endtry

        return { "status" : 500, "statusMessage" : "internal_error" }
    #enddef

    def synchSkins(self, req):
        """Synchoronizuje skiny s anonymnim uzivatelem
        """
        dbg.log("USER SKIN synch init", DBG = 1)
        dbg.log("USER SKIN synch custom: %s id: %d", (self.skinCustom, self.skinId), DBG = 1)

        # pokud ma uzivatel nastaveny vlastni obrazek, nic se nedeje
        if len(self.skinCustom):
            dbg.log("USER SKIN selected custom skin %s", self.skinCustom, INFO = 1)
            return

        anonymSkinId = 0
        try:
            values = self.getAnonymOptions(req)
            anonymSkinId = values.get("skinId", 0)

            self.skinCustom = values.get("skinCustom", "")
            self.skinCustomOpacity = values.get("skinCustomOpacity", False)
            self.skinCustomSynched = True

            dbg.log("USER SKIN: setting skinCustom from anonym user: %s", self.skinCustom, INFO = 1)

        except Exception, e:
            dbg.log("USER SKIN: Failt to recognise anonym user: %s", str(e), DBG = 3)
            pass
        # pokud neni nastaven skinId a zaroven neni ani skinCustom, nastav co
        # ti prislo z anonym jako
        if not self.skinId and not len(self.skinCustom):
            if anonymSkinId:
                self.skinId = anonymSkinId
            else:
                self.skinId = self.skinIdDefault

            self.skinIdSynched = True
        #endif

        dbg.log("USER SKIN: synch ended with skinId: %d, skinCustom: %s, skinCustomOpacity: %d", (self.skinId, self.skinCustom, self.skinCustomOpacity), DBG = 1)
        return

    #enddef

    def synchWeather(self, req):
        defaultWeatherFeedId = 0
        try:
            weatherFeedId = self.getAnonymOption(req, "weatherFeedId")
            if (
                weatherFeedId != None and
                weatherFeedId != defaultWeatherFeedId and
                self.weatherFeedId == defaultWeatherFeedId
            ):
                self.weatherFeedId = weatherFeedId
                self.weatherFeedIdSynched = True
            #endif
        except Exception, e:
            dbg.log("USER WEATHER synch: Failed to load anonym user options: %s",
                    str(e), DBG = 3)
        else:
            dbg.log("USER WEATHER synch: weatherFeedId: %d weatherFeedIdSynched: %d",
                    (self.weatherFeedId, self.weatherFeedIdSynched), INFO = 1)
        #endtry

        if self.weatherFeedId == defaultWeatherFeedId:
            self.weather_autodetect()
        #endif
    #enddef

    def synchZodiac(self, req):
        defaultZodiacFeedId = 185

        if self.zodiacFeedId and (self.zodiacFeedId != defaultZodiacFeedId):
            return

        try:
            zodiacFeedId = self.getAnonymOption(req, "zodiacFeedId")

            if zodiacFeedId and (zodiacFeedId != defaultZodiacFeedId):
                self.zodiacFeedId = zodiacFeedId
                self.zodiacFeedIdSynched = True

        except Exception, e:
            dbg.log("USER ZODIAC synch: Failt to load anonym user options: %s", str(e), DBG = 3)
            pass

        dbg.log("USER ZODIAC synch: zodiacFeedId: %d zodiacFeedIdSynched %d", (self.zodiacFeedId, self.zodiacFeedIdSynched), INFO = 1)
        return

    #enddef

    def synchFeeds(self, req):
        anonymFeedList = self.getAnonymOption(req, "layout")

        if not anonymFeedList:
            dbg.log("LOGGED SYNCH FEED no anonym feedList -> no synch. ", INFO = 1)
            return

        userFeedList = self.listFeeds()
        defaultFeedList = req.config.feeds.feedList

        # has user default feed list?
        if len(userFeedList) != len(defaultFeedList):
            dbg.log("LOGGED SYNCH FEED synch: different length of lists -> no synch. ", INFO = 1)
            return

        userFeedListMap = {}
        for feed in userFeedList:
            userFeedListMap[feed["feedId"]] = feed

        try:
            dbg.log("FEED %s", str(defaultFeedList), DBG = 1)
            dbg.log("FEED %s", str(userFeedListMap), DBG = 1)
            for feed in defaultFeedList:
                if feed["feedId"] not in userFeedListMap:
                    dbg.log("LOGGED SYNCH FEED synch: missing feed -> end ", INFO = 1)
                    return

                userFeed = userFeedListMap[feed["feedId"]]

                for option in ["rowCount", "column", "row"]:
                    if userFeed[option] != feed[option]:
                        dbg.log("LOGGED SYNCH FEED synch: something is different: %s %s %s %s", (str(userFeed[option]), str(feed[option]), option, str(feed["feedId"])), INFO = 1)
                        return

        except Exception, e:
            dbg.log("LOGGED SYNCH FEED synch: failed: %s", str(e), INFO = 1)
            return


        if anonymFeedList:
            feeds = []
            for col, column in enumerate(anonymFeedList.split("|")):
                if not column:
                    continue
                #endif
                for row, feed in enumerate(column.split(",")):
                    if not feed:
                        continue
                    #endif
                    feedId, rowCount = feed.split(":")
                    feeds.append({
                        "feedId": int(feedId),
                        "column": col,
                        "row": row,
                        "rowCount": int(rowCount),
                    })
                #endfor
            #endfor

            if self.commericial_feed not in [feed["feedId"] for feed in feeds]:
                # Pridame reklamni feed, ktery chybi v anonym listu.
                # Po syncu z anonym listu by se jinak reklama ztratila a nezobrazila.
                feeds.append({
                    "feedId": 94888,
                    "column": 1,
                    "row": 0,
                    "rowCount": 0,
                })
            #endif

            self._feedList = self.filterFeeds(feeds)
            dbg.log("LOGGED SYNCH FEED synch: synched", INFO = 1)
        else:
            dbg.log("LOGGED SYNCH FEED synch: could not found layout option.", INFO = 1)
    #enddef

    # load all anonym options in to the class memory
    #   optionName - return specific option
    def getAnonymOption(self, req, optionName):
        self.__loadAnonymOptions(req)

        try:
            value = self.__anonymOptions[optionName]
        except Exception, e:
            dbg.log("LOGGED SYNCH failed to retrieve anonym option %s due to: %s", (str(optionName), str(e)), WARN = 1)
            value = None

        return value;
    #enddef

    def getAnonymOptions(self, req):
        self.__loadAnonymOptions(req)

        return self.__anonymOptions
    #enddef

    def __loadAnonymOptions(self, req):
        if not hasattr(self, "__anonymOptions"):
            try:
                cacher = CookieCacher(req.config.cookiecacher)
                try:
                    self.__anonymOptions = cacher.getUserValues(req)
                except Exception, e:
                    dbg.log("CCACHE failed to load attrs from cookie: %s", str(e), DBG = 1)
                    self.__anonymOptions = req.config.mynosql.getUserValues(self.anonymId)
            except Exception, e:
                dbg.log("LOGGED SYNCH failed to load all anonym options due to: %s", (str(e)), WARN = 1)
                self.__anonymOptions = {}
#endclass
