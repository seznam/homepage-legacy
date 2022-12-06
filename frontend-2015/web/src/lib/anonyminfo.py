#/bin/env python2.2
# $Id$
"""
DESCRIPTION   Anonym info
"""
from dbglog import dbg
from defaultinfo import DefaultInfo, AuthorizationException
from cookiecacher import CookieCacher
from tokengenerator import TokenGenerator
import time
import datetime


class AnonymInfo(DefaultInfo):
    """
    Trida zpristupnujici data neprihlaseneho uzivatele
    """

    def __init__(self, req, checkHashId=True):
        """
        Inicializuje objekt anonymniho uzivatele.
        """

        dbg.log("ANONYM initing", INFO=1)
        # inicializuje defaultni hodnoty
        DefaultInfo.__init__(self, req)

        self.__req = req
        self.mynosql = req.config.mynosql
        self.config = req.config
        self.variation = self.config.abTest.getVariation(req)

        # theres attributes are save to db if set to specific value but default
        self.__attrToDb = ("skinId", "skinCustom", "skinCustomOpacity", "layout", "zodiacFeedId", "weatherFeedId",)

        # theres attributes are save in any case
        self.__attrToDbForce = ()

        # zakladni nastaveni
        self.loggedUser = False
        self.tokenGenerator = TokenGenerator(self.config.tokenGenerator)

        if checkHashId:
            try:
                hashId = req.form.post.getfirst("hashId")
            except KeyError:
                hashId = req.form.get.getfirst("hashId")

            try:
                self.verifyHashId(hashId)
                dbg.log("SEC HASHID hashid ok %s", hashId, DBG=1)
            except ValueError:
                raise AuthorizationException
        #endif

        #generate new hashId
        self.hashId = self.tokenGenerator.generate(self.anonymId)

        self.__getAttributes(req)

        # set cookie (updatuj cas)
        if self.anonymId:
            lib_util.setAnonymId(req, self.anonymId)
        #endif

        dbg.log("ANONYM initing done", DBG=1)
    #enddef

    def __getAttributes(self, req):
        """
        Nastavi anonymnimu uzivately hodnoty z db/cookies
        """

        try:
            values = {}
            cacher = CookieCacher(req.config.cookiecacher)
            cacheThem = False

            try:
                values = cacher.getUserValues(req)
            except Exception, e:
                dbg.log("CCACHE failed to load attrs from cookie: %s", str(e), DBG = 1)
                values = self.mynosql.getUserValues(self.anonymId)
                cacheThem = True

            toSave = {}
            for key in self.__attrToDb:
                if values.has_key(key):
                    toSave[key] = values[key]

            # cache to cookie and set to object
            if toSave:
                if cacheThem:
                    cacher.setUserValues(req, toSave)

                for key, value in toSave.iteritems():
                    setattr(self, key, value)
            #endfor

        except Exception, e:
            dbg.log("ANONYM: failed to get user for user %d values: %s ", (self.anonymId, str(e)), DBG = 3)
            lib_util.setASCookie(req, "", remember = False)

    #enddef

    def setAttributes(self, req):
        # map of elements to be saved toSave["attr"] = value
        toSave = {}

        # remove other attributes from db
        removeOther = False

        # get default setting:
        defaultValues = DefaultInfo(req)

        # check if its not in default value
        for attr in self.__attrToDb:
            if getattr(self, attr) != getattr(defaultValues, attr):
                dbg.log("ANONYM db saving: %s ", (attr,), DBG = 1)
                toSave[attr] = getattr(self, attr)
            else:
                removeOther = True

        # save for sure
        for attr in self.__attrToDbForce:
            toSave[attr] = getattr(self, attr)

        # save if there is something to remember
        if len(toSave):
            try:
                if self.anonymId:
                    self.mynosql.setUserValues(toSave, self.anonymId, removeOther)
                else:
                    self.anonymId = self.mynosql.setUserValues(toSave)
                    # set cookie
                    if self.anonymId:
                        lib_util.setAnonymId(req, self.anonymId)

            except Exception, e:
                dbg.log("MyNoSQL failed to save data: %s self.anonymId: %s", (str(e), self.anonymId), WARN = 2)
                pass

            try:
                cache = CookieCacher(req.config.cookiecacher)
                cache.setUserValues(req, toSave)
            except Exception, e:
                dbg.log("CCACHE saving failed with anonymId: %d ,something went wrong: %s", (self.anonymId, str(e)), WARN = 2)
                pass
        # jinak pryc s tim
        else:
            dbg.log("ANONYM db: removing all user values for user %s", self.anonymId, DBG = 1)
            # remove cookies cache
            try:
                ccache = CookieCacher(req.config.cookiecacher)
                ccache.removeUserValues(req)
            except Exception, e:
                dbg.log("CCACHE failed to remove cookies %s", str(e), WARN = 2)
                pass

            if self.anonymId:
                # remove user details
                try:
                    self.mynosql.markUserToBeRemoved(self.anonymId)
                except Exception, e:
                    dbg.log("MyNoSQL failed to remove from db %s", str(e), WARN=2)
                    pass

                # remove cookie with id
                lib_util.setASCookie(req, 0, remember=False)
    #enddef

    def listFeeds(self):
        """Vrati seznam RSS zdroju daneho uzivatele
        """

        feeds = []
        layout = self.__ensureCorrectLayout(self.layout)
        for col, column in enumerate(layout.split("|")):
            if not column:
                continue
            #endif
            for row, feed in enumerate(column.split(",")):
                if not feed:
                    continue
                #endif

                feedId, rowCount = map(int, feed.split(":"))

                if feedId == 94888:
                    # Feed s reklamou nevydavame neprihlasenym uzivatelum
                    continue

                if feedId == 71510 and rowCount < 3:
                    # Boxik prozeny.cz
                    rowCount = 3
                #endif

                # Ticket #550: Vice zprav ze Sportu na HP
                #sportSwitchFromTS = self.__req.config.control.sportSwitchFromTS
                #if (feedId == 181 and sportSwitchFromTS > 0
                #        and sportSwitchFromTS < time.time()):
                #    rowCount += 1
                #endif

                if feedId == 181 and rowCount < 4 and datetime.date(2015, 5, 1) <= datetime.date.today() <= datetime.date(2015, 5, 17):
                    # Boxik sport.cz - 4. pozice na ms v hokeji
                    rowCount = 4
                #endif

                # ---------------------------------------
                feeds.append({
                    "feedId": feedId,
                    "column": col,
                    "row": row,
                    "rowCount": rowCount,
                })
            #endfor
        #endfor
        return feeds
    #enddef

    # metoda urcena na precistenie zoznamu feedov od feedov, ktore uzivatel neuvidi
    def filterFeeds(self, feeds):
        #f = []
        #for feed in feeds:
        #    if feed['typeId'] != 'email':
        #        f.append(feed)
        return feeds
    #enddef


    def listEmails(self, emailId):
        """Vrati seznam zprav pro daneho uzivatele a email
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return ({}, [],)
    #enddef


    def listSearch(self, isHidden = True):
        """Vrati seznam Searchu daneho uzivatele.

        isHidden -- kapabilita rozhrani, viz loggedinfo.py
        """
        return self.defaultSearchList()
    #enddef


    def hasGadgetWithType(self, typeId, groupId):
        for feed in self.listFeeds():
            if typeId == feed['typeId'] and groupId == feed['groupId']:
                return True
        return False
    #enddef


    def getFacebookAttributes(self):
        """Vrati uzivatelovy parametry facebooku v dictionary
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return {}
    #enddef


    def setFacebookAttributes(self, attributes):
        """Vrati uzivatelovy parametry facebooku v dictionary
        """
        raise lib_error.Error("Cannot set facebook attributes for anonym user.")
    #enddef


    def resetSearch(self):
        """Vynuluje hledani pro danneho uzivatel
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def setDefaults(self, req):
        """
        Nastavi uzivateli defaultni hodnoty (tim, ze ho smaze)
            zachova skin, pokud je nastaven
        """
        dbg.log("ANONYM setting to default values", DBG = 1)
        dbg.log("ANONYM CCACHE removing cached infos", DBG = 2)
        try:
            # remove cached cookies
            ccache = CookieCacher(req.config.cookiecacher)
            ccache.removeUserValues(req)
        except Exception, e:
            dbg.log("CCACHE removing cached cookies failed %s", str(e), WARN = 3)
            raise lib_error.Error(str(e))

        # if there is no anonymId there is no reason to continue
        if not self.anonymId:
            return
        #endif

        # these options are going to be saved when setting to default
        # (if there is something going on)
        #save = ("skinId", "skinCustom", "skinCustomOpacity",)
        dbg.log("ANONYM setting to default values of anonym id: %d", self.anonymId, DBG = 1)
        dbg.log("ANONYM MyNoSQL removing data from db", DBG = 2)
        try:
            self.mynosql.markUserToBeRemoved(self.anonymId)
            # remove id
        except Exception, e:
            dbg.log("MyNoSQL failed to remove user values: %s", str(e), WARN = 3)
            pass
        #endtry

        # remove id cookie
        dbg.log("ANONYM removing cookie with id", DBG = 2)
        lib_util.setASCookie(req, 0, remember = False)
        return
    #enddef


    def addFeed(self, feedAttributes):
        """Prida do databaze uzivatele novy feed
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def moveFeed(self, feedList):
        """Presune feedy
        """

        try:
            feedDefaults = self.__req.config.feeds.feedList
            columns = [[] for _ in set(feed["column"] for feed in feedDefaults)]

            feedDefaultsMap = {}
            for feed in feedDefaults:
                feedDefaultsMap[feed["feedId"]] = feed
            #endfor

            for col, feedIds in enumerate(feedList):
                for row, feedId in enumerate(feedIds):
                    if feedId in feedDefaultsMap:
                        rowCount = feedDefaultsMap[feedId]["rowCount"]
                        columns[col].insert(row, "%s:%s" % (feedId, rowCount))
                    #endif
                #endfor
            #endfor

            layout = "|".join(",".join(column) for column in columns)
            self.layout = self.__ensureCorrectLayout(layout)
        except:
            self.layout = self.defaultLayout()
        #endtry

        self.setAttributes(self.__req)
    #enddef

    def __ensureCorrectLayout(self, layout):
        """
        Zajisti spravne rozlozeni feedu
        """

        feedDefaults = self.__req.config.feeds.feedList
        try:
            feedDefaultsMap = {}
            for feed in feedDefaults:
                feedDefaultsMap[feed["feedId"]] = feed
            #endfor
            for column in layout.split("|"):
                if not column:
                    continue
                #endif
                for feed in column.split(","):
                    if not feed:
                        continue
                    #endif
                    feedId, rowCount = feed.split(":")
                    if int(feedId) not in feedDefaultsMap:
                        return self.defaultLayout()
                    #endif
                    rowCount = int(rowCount)
                #endfor
            #endfor
        except:
            return self.defaultLayout()
        #endtry

        return layout
    #enddef

    def removeFeed(self, feedId):
        """Odebere z databaze uzivatele zdroj
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def removeFeeds(self, feeds):
        """Odebere z databaze uzivatele zdroj
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def feedSetAttributes(self, feedId, attributes):
        """Nastavi vlastnosti feedu
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def feedGetAttributes(self, feedId):
        """Vrati vlastnosti feedu
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return {}
    #enddef


    def feedsCreate(self, list):
        """Zalozi vsechny feedy najednou multicallem
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def feedUpdate(self, list):
        """Nastavi vlastnosti hledani
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def searchSet(self, listSearch):
        """Nastavi vlastnosti hledani
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def searchCreate(self, searchAttributes):
        """Zalozi uzivateli nove hledani
        """
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def searchesCreate(self, list):
        """Zalozi searche vsechny najednou multicallem
        """
        dbg.log('Not supported for anonym user', DBG=1)
        return
    #enddef

    def verifyHashId(self, hashId):
        """Overi, ze zadane hashId odpovida uzivatelovu hashId
        """
        if not self.tokenGenerator.validate(hashId):
            dbg.log("ANONYM HASHID SEC failed to validate hashId %s for id %i", (str(hashId), self.anonymId), DBG=1)
            raise ValueError, hashId
        #endif

        return True
    #enddef


    def getNote(self, note):
        dbg.log('Not supported for anonym user', DBG=1)
        return
    #enddef


    def getNotes(self):
        dbg.log('Not supported for anonym user', DBG = 1)
        return []
    #enddef


    def setNote(self, note, content, hidden = 1):
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def setNoteVisibility(self, note, hidden = 1):
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def removeNote(self, note):
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef


    def setByOther(self, newUserId):
        dbg.log('Not supported for anonym user', DBG = 1)
        return
    #enddef

    def synchSkins(self, req):
        if not self.skinId and not len(self.skinCustom):
            self.skinId = self.skinIdDefault
            self.skinIdSynched = True
        return

    def synchWeather(self, req):
        if self.weatherFeedId == 0:
            self.weather_autodetect()
        #endif
    #enddef

    def synchZodiac(self, req):
        return
    #enddef

    def synchFeeds(self, req):
        return
    #enddef
#endclass
