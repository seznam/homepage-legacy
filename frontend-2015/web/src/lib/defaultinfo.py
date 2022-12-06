#
# $Id$
"""
DESCRIPTION   Default info
"""

from dbglog     import dbg

class DefaultInfo:
    """
    Prapredev vsech uzivatelu, obsahuje defaultni nastaveni.
    """

    def __init__(self, req):
        """
        Inicializuje objekt uzivatele.
        """

        # Zpusobuje cyklickou referenci
        # self.req = req
        self.config = req.config
        self.pageId = req.uri.lower()[1:]

        self.remoteIp = req.headers_in.get(
                req.config.control.forwardedForHeader,
                req.connection.remote_ip)
        self.remoteIp = lib_util.getLastIp(self.remoteIp)

        self.inetInfo = lib_util.InetInfo(req)

        # Zajisti nezobrazeni zadneho obsahu pokud prichazi tento attr
        if req.form:
            req.nocontent = req.form.get.getfirst("nocontent", str, "") \
                or req.form.post.getfirst("nocontent", str, "")

        #defaultni hodnoty
        self.session = ""
        self.userId = 0
        self.anonymId = lib_util.getAnonymId(req)
        self.skinSelected = None
        self.temporary = 1
        self.username = ""
        self.domain = ""
        self.greeting = ""
        self.portraitUrl = ""
        self.suggest = 1
        self.friends = 0
        self.hideCatalogue = 0
        self.language = self.config.template.defaultLanguage
        self.sex = "M"
        self.age = 0
        self.skin = 0
        self.skinId = 0
        self.skinIdDefault = self.config.skins.defaultSkinId

        self.skinCustom = ""
        self.skinCustomOpacity = 0
        self.skinCustomSynched = False
        self.skinIdSynched = False
        self.layout = self.defaultLayout()
        self.emailCount = 6
        self.externalSkin = ""
        self.tvChannelId = self.config.tv.defaultTvChannels
        self.createdOnTvServer = False
        self.currencyId = []

        self.zodiacFeedId = 185
        self.zodiacFeedIdSynched = False

        self.weatherFeedId = 0
        self.weatherFeedIdSynched = False
        self.weatherByGeoIP = False
        self.weatherFailedGeoIP = False

        self.selectedNote = 1
        self.columns = 2
        self.regionGasId = 1
        self.usingEmail = True
        self.disabledEmail = False
        self.hashId = 0
        self._feedList = []
        self.last_login = 0
        self.tvTipDisabled = 1

        # hint defaults
        self.hint_wait_delay = 1209600
        self.hint_delete_delay = 5184000

        self.geoIpRegion = lib_util.getGeoIpRegion(req)

        # variation
        #if req.form:
        #    self.variation = req.form.get.getfirst("variation", str, "") or lib_util.getVariation(req)
        #    generateSorryPage = req.form.get.getfirst('generateSorryPage', default = '')
        #    generatePreprocessedPage = req.form.get.getfirst('generatePreprocessedPage', default = '')
        #    if not ((generateSorryPage or generatePreprocessedPage or req.config.control.abTest) and self.variation in ("A", "B")):
        #        self.variation = ""
        #else:
        #    self.variation = ""
        self.variation = ""
    #enddef

    def createDataRoot(self):
        """
        Vrati root fragment
        """

        data = {
            'userId'    : self.userId,
            'anonymId'  : self.anonymId,
            'username'  : self.username,
            'domain'    : self.domain,
            'language'  : self.language,
            'sex'       : self.sex,
            'age'       : self.age,
            'greeting'  : self.greeting,
            'suggest'   : self.suggest,
            'friends'   : self.friends,
            'showCatalogue' : int(not self.hideCatalogue),
            'portraitUrl'   : self.portraitUrl,
            'pageId'        : self.pageId,
            'skin'          : self.skin,
            'skinId'        : self.skinId,
            'skinIdSynched' : self.skinIdSynched,
            'skinCustom'    : self.skinCustom,
            "skinCustomOpacity" : self.skinCustomOpacity,
            'externalSkin'  : self.externalSkin,
            'emailCount'    : self.emailCount,
            'selectedNote'  : self.selectedNote,
            'columns'       : self.columns,
            'usingEmail'    : self.usingEmail,
            'disabledEmail' : self.disabledEmail,
            'hashId'        : self.hashId,
            'variation'     : self.variation,
            'tvTipDisabled' : self.tvTipDisabled,
            'ownSkinEnable' : self.userId > 0,
        }

        dataRoot = self.config.teng.createDataRoot(data)

        try:
            res = self.config.frog.proxy.logo.checkToDisplay()

            if res["status"] == 200:
                for i in res["logos"]:
                    dataRoot.addFragment("logo", {
                        "id": i["id"], "url": i["url"],
                        "pictureUrl": i["pictureUrl"], "picture2Url": i["picture2Url"],
                        "picture3Url": i["picture3Url"], "pict3AnimLen": i["pict3AnimLen"],
                        "width": i["width"], "height": i["height"], "name": i["name"]
                    })
                #endfor
            else:
                dbg.log("failed to load logo %s", res["statusMessage"], WARN=1)
            #endif
        except Exception, e:
            dbg.log("LOGO FRPC failed to load %s", str(e), WARN=2)
        #endtry

        try:
            res = self.config.frog.proxy.dog.checkToDisplay()

            if res["status"] == 200:
                for i in res["dogs"]:
                    dataRoot.addFragment("dog", {"id": i["id"], "url": i["url"], "pictureUrl": i["pictureUrl"], "width": i["width"], "height": i["height"], "name": i["name"]})
            else:
                dbg.log("failed to load dog %s", res["statusMessage"], WARN = 1)
                #endfor
            #endif
        except Exception, e:
            dbg.log("DOG FRPC failed to load %s", str(e), WARN = 2)

        return dataRoot
    #enddef

    def defaultLayout(self):
        feedList = self.config.feeds.feedList

        columns = []
        for i in set(feed["column"] for feed in feedList):

            feedGen = ((v["feedId"], v["rowCount"])    \
                for v in feedList if v["column"] == i)

            columns.insert(i, ",".join("%s:%s" % feed  \
                for feed in feedGen))

        #endfor
        return "|".join(columns)
    #enddef

    def defaultSearchList(self):
        """Vrati vychozi seznam Searchu
        """

        fp = self.config.frog.proxy
        svcs = self.config.searchServices.defaults
        res = fp.search.getDefaultContentList(svcs)
        if res['status'] / 100 != 2:
            raise lib_error.UnexpectedResponse(fp, res)
        #endif

        return res["search"]
    #enddef

    def weather_autodetect(self):
        try:
            weatherFeedId = lib_geoip.feedIdRegionMap.get(self.geoIpRegion, 0)
            if weatherFeedId:
                self.weatherFeedId = weatherFeedId
                self.weatherByGeoIP = True
            else:
                self.weatherFeedId = 99
                self.weatherFailedGeoIP = True
                self.weatherByGeoIP = True
            #endif
        except:
            self.weatherFeedId = 99
            self.weatherFailedGeoIP = True
            self.weatherByGeoIP = True
        #endtry
    #enddef
#endclass

class AuthorizationException(Exception):
    pass
