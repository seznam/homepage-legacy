#/bin/env python2.2
#
# FILE          $Id: config.py$

"""
DESCRIPTION   Homepage config parser
"""

import teng
import ConfigParser
import fastrpc
import fastrpcmc
import re

from dbglog import DbgLog, dbg
from lib.cipherer import Cipherer
from lib.util import FeedDataFactory, ABTest
from lib.error import UnexpectedResponse
import time
from cPickle import loads, dumps
import sqlite3


class Config(object):
    """
    Reprezentace knfiguracniho souboru.
    """

    def __init__(self, req):
        """
        Inicializuje tridu Config

        @param req Apache request objekt (potreba pristup k ConfigFile pres
        req.get_options()
        """

        # pri inicializaci posli chybovy vystup do apache logu
        dbg.stderr(1)

        # vytahni cestu ke konfiguraci
        pythonOptions = req.get_options()
        filenames = set((
            pythonOptions.get("ConfigFile",
                "/www/homepage/userweb/conf/homepage.conf"),
            pythonOptions.get("ConfigPasswdFile",
                "/www/homepage/userweb/conf/homepage.passwd.conf")
        ))

        dbg.log("Reading config files %s",
            repr(tuple(filenames)), INFO = 3)

        # nacti konfiguraci
        parser = ConfigParser.ConfigParser()
        successFilenames = set(parser.read(filenames))
        if successFilenames != filenames:
            raise ConfigParser.ParsingError("Can't read: %s" \
                % repr(tuple(filenames - successFilenames)))
        #endif

        # jednotlive sekce konfigurace
        self.control = _ConfigControl(parser)
        self.feeds = _ConfigFeeds(parser)
        self.searchServices = _ConfigSearchServices(parser)
        self.template = _ConfigTemplate(parser)
        self.skins = _ConfigSkins(parser)
        self.cookiecacher = _ConfigCCacher(parser)
        self.tokenGenerator = _ConfigTokenGenerator(parser)
        self.hintCookies = _ConfigHintCookies(parser)

        self.ubox = _ConfigBox(parser, "userbox")
        self.sbox = _ConfigBox(parser, "sbox")
        self.hint = _ConfigBox(parser, "hint")
        self.frog = _ConfigBox(parser, "frog")
        self.search = _ConfigBox(parser, "search")
        self.firmSearch = _ConfigBox(parser, "firmsearch")
        self.tip = _ConfigBox(parser, "tip")
        self.repository = _ConfigBox(parser, "repository")

        self.http = _ConfigHttp(parser)
        self.tv = _ConfigTv(parser)
        self.rates = _ConfigRates(parser)
        self.foreignEmail = _ConfigForeignEmail(parser)

        #self.livestream = _ConfigBox(parser, "livestream")

        self.horoscope = _ConfigBox(parser, "horoscope")
        self.tvServer = _ConfigBox(parser, "tvserver")
        self.mynosql = _MyNoSqlFRPC(parser)

        self.contentRegExp = re.compile("/+")
        self.presetNameRegExp = re.compile("[a-z\-]+")

        # inicializuj DBGLOG podle konfigurace
        if self.control.log:
            dbg.file(self.control.log)
        #endif
        dbg.mask(self.control.logMask)
        dbg.stderr(0)

        try:
            self.control.availableDomains = \
                self.ubox.proxy.listLoginDomains()["domains"]
        except (fastrpc.Error, KeyError):
            dbg.log("Undefined [control]::AvailableDomains", ERR = 3)
            raise lib_error.ConfigError, "[control]::AvailableDomains"
        #endtry

        # exception dbglog
        if self.control.exceptionLog:
            self.edbg = DbgLog(self.control.exceptionLog,
                self.control.exceptionLogMask)
        else:
            self.edbg = DbgLog("/dev/null", "F4")
        #endif

        # vytvor instanci Teng objektu, ktery
        # lze pouzit ve vsech metodach webovky
        self.teng = teng.Teng(self.template.path, "utf-8", "text/html")

        self.abTest = ABTest(self)
    #enddef
#endclass


class _ConfigControl(object):
    """
    Parser sekce [control].
    """

    def __init__(self, parser):
        """
        Inicializace a parsing sekce [control].
        """
        try:
            self.log = parser.get("control", "Log")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [control]::Log, " \
                "disabling logging", WARN = 3)
            self.log = None
        #endtry

        try:
            self.logMask = parser.get("control", "LogMask")
        except ConfigParser.NoOptionError:
            self.logMask = "I3W2E2F1"
            dbg.log("Undefined [control]::LogMask, " \
                "using `%s'", self.logMask, WARN = 3)
        #endtry

        try:
            self.baseUrl = parser.get("control", "BaseUrl")
        except ConfigParser.NoOptionError:
            self.baseUrl = "http://www.seznam.cz"
            dbg.log("Undefined [control]::BaseUrl, " \
                "using `%s'", self.baseUrl, WARN = 3)
        #endtry

        try:
            self.baseUrlHTTPS = parser.get("control", "BaseUrlHTTPS")
        except ConfigParser.NoOptionError:
            self.baseUrlHTTPS = "https://www.seznam.cz"
            dbg.log("Undefined [control]::BaseUrlHTTPS, " \
                "using `%s'", self.baseUrlHTTPS, WARN = 3)
        #endtry

        try:
            self.UrlTld = parser.get("control", "UrlTld")
        except ConfigParser.NoOptionError:
            self.UrlTld = "cz"
            dbg.log("Undefined [control]::UrlTld, " \
                "using `%s'", self.UrlTld, WARN = 3)
        #endtry

        try:
            self.exceptionLog = parser.get("control", "ExceptionLog")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [control]::ExceptionLog, " \
                "disabling logging", WARN = 3)
            self.exceptionLog = None
        except ValueError:
            raise
        #endtry

        try:
            self.exceptionLogMask = parser.get("control", "ExceptionLogMask")
        except ConfigParser.NoOptionError:
            self.exceptionLogMask = "I3W2E2F1"
            dbg.log("Undefined [control]::ExceptionLogMask, " \
                "using `%s'", self.exceptionLogMask, WARN = 3)
        #endtry

        try:
            self.serviceId = parser.get("control", "ServiceId")
        except ConfigParser.NoOptionError:
            self.serviceId = "homepage"
            dbg.log("Undefined [control]::ServiceId, " \
                "using `%s'", self.serviceId, WARN = 3)
        #endtry

        try:
            self.defaultDomain = parser.get("control", "DefaultDomain")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [control]::DefaultDomain", ERR = 3)
            raise lib_error.ConfigError, "[control]::DefaultDomain"
        #endtry
        try:
            self.cookieDomain = parser.get("control", "CookieDomain")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [control]::CookieDomain", ERR = 3)
            raise lib_error.ConfigError, "[control]::CookieDomain"
        #endtry
        try:
            self.userGroupId = parser.get("control", "UserGroupId")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [control]::UserGroupId", ERR = 3)
            raise lib_error.ConfigError, "[control]::UserGroupId"
        #endtry
        try:
            self.useJsFeed = parser.getint("control", "UseJsFeed")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [control]::UseJsFeed", ERR = 3)
            raise lib_error.ConfigError, "[control]::UseJsFeed"
        #endtry

        try:
            self.catalogueSections = parser.get("control", "CatalogueSections")
        except ConfigParser.NoOptionError:
            self.catalogueSections = "/www/homepage/userweb/conf/catalogue_sections.conf"
            dbg.log("Undefined [control]::CatalogueSections, " \
                "using `%s'", self.catalogueSections, WARN = 2)
        #endtry

        try:
            self.catalogueGenerateMode = parser.get("control",
                                                    "CatalogueGenerateMode")
        except ConfigParser.NoOptionError:
            self.catalogueGenerateMode = "search"
            dbg.log("Undefined [control]::CatalogueGenerateMode, " \
                "using `%s'", self.catalogueGenerateMode, WARN = 2)
        #endtry

        try:
            self.readersAllowedIps = parser.get("control",
                                                "ReadersAllowedIps").split(",")
        except ConfigParser.NoOptionError:
            self.readersAllowedIps = []
            dbg.log("Undefined [control]::ReadersAllowedIps, " \
                "using `%s'", self.readersAllowedIps, WARN = 2)
        #endtry

        try:
            self.loginServer = parser.get("control", "LoginServer")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError, "[control]::LoginServer"
        #endtry

        try:
            self.loginServerHTTPS = parser.get("control", "LoginServerHTTPS")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError, "[control]::LoginServerHTTPS"
        #endtry

        try:
            self.loggedUrl = parser.get("control", "LoggedUrl")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError, "[control]::LoggedUrl"
        #endtry

        try:
            self.loggedUrlHTTPS = parser.get("control", "LoggedUrlHTTPS")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError, "[control]::LoggedUrlHTTPS"
        #endtry

        try:
            self.nameInterpretUrl = parser.get("control", "NameInterpretUrl")
        except ConfigParser.NoOptionError:
            self.nameInterpretUrl = None
        #endtry

        try:
            self.forwardedForHeader = parser.get("control",
                                                 "ForwardedForHeader")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError, "[control]::ForwardedForHeader"
        #endtry

        try:
            self.noteCount = parser.getint("control", "NoteCount")
        except ConfigParser.NoOptionError:
            self.noteCount = 9
            dbg.log("Undefined [control]::NoteCount, " \
                "using `%s'", self.noteCount, WARN = 2)
        #endtry

        try:
            self.sorryPage = parser.getint("control", "SorryPage")
        except ConfigParser.NoOptionError:
            self.sorryPage = 0
            dbg.log("Undefined [control]::SorryPage, " \
                "using `%s'", self.sorryPage, WARN = 2)
        #endtry

        try:
            self.setByOtherIds = \
                map(int, parser.get("control", "SetByOtherIds").split(","))
        except (ConfigParser.NoOptionError, ValueError):
            self.setByOtherIds = []
        #endtry

        try:
            self.setByOtherDelay = parser.getint("control", "SetByOtherDelay")
        except ConfigParser.NoOptionError:
            self.setByOtherDelay = 0
            dbg.log("Undefined [control]::setByOtherDelay, " \
                "using `%s'", self.setByOtherDelay, WARN = 2)
        #enddef

        try:
            self.abTest = parser.getint("control", "ABTest")
        except ConfigParser.NoOptionError:
            self.abTest = 0
            dbg.log("Undefined [control]::ABTest, " \
                "using `%s'", self.abTest, WARN = 2)
        #enddef

        try:
            self.abTestCookie = parser.getint("control", "ABTestCookie")
        except ConfigParser.NoOptionError:
            self.abTestCookie = 0
            dbg.log("Undefined [control]::abTestCookie, " \
                "using `%s'", self.abTestCookie, WARN = 2)
        #enddef

        try:
            self.abTestCookieName = parser.get("control", "ABTestCookieName")
        except ConfigParser.NoOptionError:
            self.abTestCookieName = "variation"
            dbg.log("Undefined [control]::ABTestCookieName, using `%s'",
                    self.abTestCookieName, WARN = 2)
        #enddef

        try:
            self.abTestCookieMaxAge = parser.getint("control", "ABTestCookieMaxAge")
        except ConfigParser.NoOptionError:
            self.abTestCookieMaxAge = 0
            dbg.log("Undefined [control]::ABTestCookieMaxAge, using `%s'",
                    self.abTestCookieMaxAge, WARN = 2)
        #enddef

        try:
            self.abTestCookieValuePfx = parser.get("control", "ABTestCookieValuePfx")
        except ConfigParser.NoOptionError:
            self.abTestCookieValuePfx = ""
            dbg.log("Undefined [control]::ABTestCookieValuePfx, using `%s'",
                    self.abTestCookieValuePfx, WARN = 2)
        #enddef

        try:
            self.abTestVariations = parser.get("control", "ABTestVariations").split(",")
        except ConfigParser.NoOptionError:
            self.abTestVariations = ("A", "B")
            dbg.log("Undefined [control]::ABTestVariations, using `%s'",
                    self.abTestVariations, WARN = 2)
        #enddef


        try:
            self.inet6 = parser.get("control", "Inet6")
            if self.inet6 not in ("Yes", "No", "On", "Off", "True", "False"):
                raise ConfigParser.NoOptionError("Inet6", "control")
            #endif
        except ConfigParser.NoOptionError:
            self.inet6 = "No"
            dbg.log("Undefined [control]::Inet6, " \
                "using `%s'", self.inet6, WARN = 2)
        #enddef

        try:
            self.sportSwitchFromTS = parser.getint("control",
                                                   "SportSwitchFromTS")
            dbg.log("SportSwitchFromTS: %d, Time: %d",
                    (self.sportSwitchFromTS, time.time()), INFO = 3)
        except ConfigParser.NoOptionError:
            self.sportSwitchFromTS = -1
            dbg.log("Undefined [control]::SportSwitchFromTS, using `%s'",
                    self.sportSwitchFromTS, WARN = 2)
        #enddef

        try:
            self.proxy = parser.get("control", "Proxy")
            self.proxy = "http://%s" % self.proxy.replace("http://", "")
        except ConfigParser.NoOptionError:
            self.proxy = "http://proxy:3128"
            dbg.log("Undefined [control]::Proxy, using `%s'", self.proxy, WARN = 2)
        #enddef

        try:
            self.captchaServer = parser.get("control", "CaptchaServer")
            self.captchaServer = "http://%s" % self.captchaServer.replace("http://", "")
        except ConfigParser.NoOptionError:
            self.captchaServer = "http://captchaserver:3411"
            dbg.log("Undefined [control]::CaptchaServer, using `%s'", self.captchaServer, WARN=2)
        #enddef
    #enddef
#endclass


class _ConfigBox(object):
    """
    Parser sekci [sbox], [userbox], [frog], ...
    """

    def __init__(self, parser, section):
        """
        Inicializace a parsing sekce [section]
        definujici nastaveni XMLRPC/FRPC serveru.
        """
        self.section = section

        try:
            self.address = parser.get(section, "Address")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [%s]::Address", section, ERR = 3)
            raise lib_error.ConfigError, "[%s]::Address" % section
        #endtry

        try:
            self.connectTimeout = parser.getint(section, "ConnectTimeout")
        except ConfigParser.NoOptionError:
            self.connectTimeout = 10000
            dbg.log("Undefined [%s]::ConnectTimeout, using %d msec.",
                (section, self.connectTimeout), WARN = 4)
        #endtry

        try:
            self.readTimeout = parser.getint(section, "ReadTimeout")
        except ConfigParser.NoOptionError:
            self.readTimeout = 5000
            dbg.log("Undefined [%s]::ReadTimeout, using %d msec.",
                (section, self.readTimeout), WARN = 4)
        #endtry

        try:
            self.writeTimeout = parser.getint(section, "WriteTimeout")
        except ConfigParser.NoOptionError:
            self.writeTimeout = 3000
            dbg.log("Undefined [%s]::WriteTimeout, using %d msec.",
                (section, self.writeTimeout), WARN = 4)
        #endtry

        try:
            self.keepAlive = parser.getint(section, "KeepAlive")
        except ConfigParser.NoOptionError:
            self.keepAlive = 0
            dbg.log("Undefined [%s]::KeepAlive, disabling it.",
                section, WARN = 4)
        #endtry

        try:
            self.useBinary = parser.getint(section, "TransferMode")
        except ConfigParser.NoOptionError:
            self.useBinary = 0
            dbg.log("Undefined [%s]::TransferMode, using autodetect.",
                section, WARN = 4)
        #endtry

        try:
            self.fastrpcmcConf = parser.get("control", "FastrpcmcConf")
        except ConfigParser.NoOptionError:
            self.fastrpcmcConf = "/www/homepage/userweb/conf/fastrpcmc.conf"
            dbg.log("Undefined [control]::FastrpcmcConf, using %s.",
                self.fastrpcmcConf, WARN = 4)
        #endtry

        self.__proxy = None
    #enddef

    @property
    def proxy(self):
        """
        Lazy creation of server proxy.
        """
        if self.__proxy is not None:
            return self.__proxy
        #enddef

        if self.section in ("frog", "hint", "tvserver", "tip", "horoscope"):
            # create ServerProxy instance
            self.__proxy = fastrpcmc.ServerProxy(self.address,
                connectTimeout = self.connectTimeout,
                readTimeout = self.readTimeout,
                writeTimeout = self.writeTimeout,
                keepAlive = self.keepAlive,
                useBinary = self.useBinary,
                config_file = self.fastrpcmcConf
            )
        else:
            # create ServerProxy instance
            self.__proxy = fastrpc.ServerProxy(self.address,
                connectTimeout = self.connectTimeout,
                readTimeout = self.readTimeout,
                writeTimeout = self.writeTimeout,
                keepAlive = self.keepAlive,
                useBinary = self.useBinary
            )
        #endif

        return self.__proxy
    #enddef

    __slots__ = (
        "section",
        "address",
        "connectTimeout",
        "readTimeout",
        "writeTimeout",
        "keepAlive",
        "useBinary",
        "fastrpcmcConf",
        "__proxy",
    )
#endclass


class _ConfigTemplate(object):
    """
    Parser sekce [template].
    """

    def __init__(self, parser):
        """
        Inicializace a parsing sekce [template].
        """
        try:
            self.path = parser.get("template", "path")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [template]::Path", ERR = 3)
            raise lib_error.ConfigError, "[template]::Path"
        #endtry

        try:
            self.config = parser.get("template", "Config")
        except ConfigParser.NoOptionError:
            self.config = "homepage-teng.conf"
            dbg.log("Undefined [template]::Config, " \
                "using `%s'.", self.config, WARN = 4)
        #endtry

        try:
            self.dict = parser.get("template", "Dict")
        except ConfigParser.NoOptionError:
            self.dict = "homepage.dict"
            dbg.log("Undefined [template]::Dict, " \
                "using `%s'.", self.dict, WARN = 4)
        #endtry

        try:
            self.defaultLanguage = parser.get("template", "DefaultLanguage")
        except ConfigParser.NoOptionError:
            self.defaultLanguage = "cz"
            dbg.log("Undefined [template]::DefaultLanguage, using `%s'.",
                        self.defaultLanguage, WARN = 4)
        #endtry

        try:
            self.supportedLanguages = parser.get("template",
                    "SupportedLanguages").split(",")
        except ConfigParser.NoOptionError:
            self.supportedLanguages = ("cz",)
            dbg.log("Undefined [template]::SupportedLanguages, " \
                "using `%s'.", self.supportedLanguages, WARN = 4)
        #endtry
    #enddef

    __slots__ = (
        "path",
        "config",
        "dict",
        "defaultLanguage",
        "supportedLanguages",
    )
#endclass


class _ConfigFeedsCached(object):
    """
    Parser sekce [feeds-cached]
    """

    def __init__(self, parser):
        """
        Nacte cestu k DB souboru a vytvori SQLite3 spojeni.
        """

        try:
            self.database = parser.get("feeds-cached", "Database")
        except ConfigParser.NoOptionError:
            self.database = "/www/homepage/userweb/template/cache.db"
            dbg.log("Undefined [feeds-cached]::Database, "
                    "using `%s'", self.database, WARN = 3)
        #endtry

        try:
            compressed = parser.get("feeds-cached", "Compressed")
            compressed = {
                "True"  : True , "Yes" : True , "On"  : True,
                "False" : False, "No"  : False, "Off" : False,
            }.get(compressed, None)
            if compressed == None:
                raise ConfigParser.NoOptionError("Compressed", "feeds-cached")
            #endif
            self.compressed = compressed
        except ConfigParser.NoOptionError:
            self.compressed = False
            dbg.log("Undefined [feeds-cached]::Compressed, "
                    "using `%s'", self.compressed, WARN = 3)
        #endtry

        try:
            profiler = parser.get("feeds-cached", "Profiler")
            profiler = { "On": True, "Off": False }.get(profiler, None)
            if profiler == None:
                raise ConfigParser.NoOptionError("Profiler", "feeds-cached")
            #endif
            self.profiler = profiler
        except ConfigParser.NoOptionError:
            self.profiler = False
            dbg.log("Undefined [feeds-cached]::profiler, "
                    "using `%s'", self.profiler, WARN = 3)
        #endtry

        self.__data = {}
        self.__timestamp = 0

        try:
            if self.compressed:
                from zlib import compress, decompress

                sqlite3.register_adapter(dict,
                        lambda data: buffer(compress(dumps(data))))
                sqlite3.register_converter("BLOB",
                        lambda data: loads(decompress(data)))
            else:
                sqlite3.register_adapter(dict, dumps)
                sqlite3.register_converter("BLOB", loads)
            #endif

            self.connection = sqlite3.connect(self.database,
                    detect_types = sqlite3.PARSE_DECLTYPES)
            self.connection.row_factory = sqlite3.Row
            self.connection.text_factory = str

            if self.profiler:
                class Profiler(object):
                    """
                    Jednoduchy obal sqlite3.connection pro
                    mereni priblizne doby trvani sql dotazu.
                    """
                    def __init__(self, connection):
                        """
                        Konstruktor
                        """
                        self.__connection = connection
                    #enddef

                    def execute(self, sql, parameters = None):
                        """
                        Zaznamena do logu dobu trvani dotazu.
                        """
                        if parameters:
                            startExecution = time.time()
                            retval = self.__connection.execute(sql, parameters)
                        else:
                            startExecution = time.time()
                            retval = self.__connection.execute(sql)
                        #endif
                        dbg.log("SQLite: Query '%s' time=%fms" % (sql,
                            (time.time() - startExecution) * 1000), DBG = 1)
                        return retval
                    #enddef

                    def __getattr__(self, name):
                        """
                        Delegace atributu sqlite3.connection.
                        """
                        return getattr(self.__connection, name)
                    #enddef
                #endclass
                self.connection = Profiler(self.connection)
            #endeif
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError, "[feeds-cached]::connection"
        #endtry

        self.loadData()
    #enddef

    def __getitem__(self, key):
        """
        Pretizeni operatoru [].

            feed = cached[feedId]

        """

        if key in self.__data:
            return self.__data[key]
        #endif

        sql = "SELECT `data` FROM `feed` WHERE `id`=?"
        try:
            row = self.connection.execute(sql, (key,)).fetchone()
            if row:
                data = row["data"]
                self.__data[key] = data
                self.connection.commit()
                return data
            #endif
        except sqlite3.Error, err:
            dbg.log("SQLite: Failed to get feed: %s", err, WARN = 2)
            self.connection.rollback()
        #endtry

        raise KeyError(key)
    #enddef

    def dataFactory(self, feedDefinitionList, frog, feedOutageUrl):
        """
        Vrati generator dat pro feedy definovane parametrem `feedDefinitionList'.
        Parametr `frog' je instance backendoveho `fastrpc.ServerProxy' pro dotazeni
        dat k feedum, ktere nejsou v cache.
        """

        return FeedDataFactory(self, feedDefinitionList, frog, feedOutageUrl)
    #enddef

    def loadData(self):
        """
        Vrati data k feedum z kes.
        """
        try:
            query = "SELECT `id`,`data` FROM `feed`"
            rows = self.connection.execute(query).fetchall()
            self.__data.update((row["id"], row["data"]) for row in rows)
            self.__timestamp = self.getTimestamp()
        except sqlite3.Error, err:
            dbg.log("SQLite: failed to load data: %s", err, WARN = 2)
            self.connection.rollback()
        else:
            self.connection.commit()
        #endtry
    #enddef

    def getData(self, timestamp = 0):
        """
        Zaktualizuje a vrati data k feedum.
        """
        if ((timestamp - self.__timestamp) > 63
          or self.__timestamp == 0
          or not self.__data
        ):
            self.loadData()
        #endif
        return self.__data
    #enddef

    def getTimestamp(self):
        """
        Vrati casove razitko posledni aktualizace kes.
        """
        timestamp = 0
        try:
            sql = "SELECT `timestamp` FROM `last_update` WHERE `id` = 1"
            row = self.connection.execute(sql).fetchone()
            if row:
                timestamp = int(row["timestamp"])
            #endif
        except sqlite3.Error, err:
            dbg.log("SQLite: Failed to get timestamp: %s", err, WARN = 2)
            self.connection.rollback()
        else:
            self.connection.commit()
        #endtry
        return timestamp
    #enddef

    __slots__ = (
        "database",
        "compressed",
        "connection",
        "profiler",
        "__data",
        "__timestamp"
    )
#endclass


class _ConfigFeeds(object):
    """
    Parser sekce [feeds].
    """

    def __init__(self, parser):
        """
        Inicializace a parsing sekce [feeds].
        """
        try:
            self.mappingFile = parser.get("feeds", "MappingFile")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError, "[feeds]::MappingFile"
        #endtry

        try:
            self.feedListBaseUrl = parser.get("feeds", "FeedListBaseUrl")
        except ConfigParser.NoOptionError:
            self.feedListBaseUrl = ""
            dbg.log("Undefined [feeds]::FeedListBaseUrl, "
                "using `%s'", self.feedListBaseUrl, WARN = 3)
        #endtry

        try:
            self.defaultCount = parser.getint("feeds", "DefaultCount")
        except ConfigParser.NoOptionError:
            self.defaultCount = 5
            dbg.log("Undefined [feeds]::defaultCount, "
                "using `%s'", self.defaultCount, WARN = 3)
        #endtry

        try:
            self.outageUrl = parser.get("feeds", "OutageUrl")
        except ConfigParser.NoOptionError:
            self.outageUrl = "/vypadek"
            dbg.log("Undefined [feeds]::OutageUrl, "
                "using `%s'", self.outageUrl, WARN = 3)
        #endtry

        self.cached = _ConfigFeedsCached(parser)

        try:
            feedTempl = ("feedId", "column", "row", "rowCount")

            feedsGen = (dict(zip(feedTempl, map(int, f.split(":")))) \
                for f in parser.get("feeds", "Defaults").split(","))

            self.feedList = sorted(feedsGen,
                key = lambda x: (x["column"], x["row"]))

        except (ConfigParser.NoOptionError, ValueError):
            self.feedList = []
            dbg.log("Error parsing FeedList, "
                "using `%s'", self.feedList, WARN = 3)
        #endtry

        # nacti mapovani
        parser = ConfigParser.ConfigParser()
        f = open(self.mappingFile, "r")
        parser.readfp(f)
        f.close()

        self.weatherMapping = self.parseWeather(parser)
        self.zodiacMapping = self.parseZodiac(parser)
    #enddef

    def _getOption(self, parser, section, name):
        try:
            ret = parser.get(section, name)
        except (ConfigParser.NoOptionError, ConfigParser.NoSectionError):
            raise lib_error.ConfigError, "[%s]::[%s]" % (section, name)
        #endtry

        return ret
    #enddef

    def parseWeather(self, parser):
        """
        Parsing mapovani RSS zdroju v sekci [weather].
        """

        ret = ({}, {}, [])
        for (op, dummy) in lib_uiradr.district.items():
            # v konfiguraku mame CZXXXX=111   # comment
            # takze #comment vyhodime - pomoci split("#")[0]
            feedId = int(self._getOption(parser, "weather", op).split("#")[0])
            ret[0][feedId] = op
            ret[1][op] = feedId
            ret[2].append({"name" : op, "feedId" : feedId})
        #endfor

        return ret
    #enddef

    def parseZodiac(self, parser):
        """
        Parsing mapovani RSS zdroju v sekci [zodiac].
        Po mapovani ma vysledni slovnik hodnoty feedId->name i name->feedId.
        """

        ret = ({}, {}, [])
        for op in (
          "beran", "byk", "blizenci", "rak", "lev", "panna", "vahy",
          "stir", "strelec", "kozoroh", "vodnar", "ryby", "nahodne"
        ):
            feedId = int(self._getOption(parser, "zodiac", op))
            ret[0][feedId] = op
            ret[1][op] = feedId
            ret[2].append({"name" : op, "feedId" : feedId})
        #endfor

        return ret
    #enddef

    __slots__ = (
        "mappingFile",
        "feedListBaseUrl",
        "defaultCount",
        "outageUrl",
        "cached",
        "feedList",
        "weatherMapping",
        "zodiacMapping",
    )
#endclass


class _ConfigSearchServices(object):
    """
    Parser sekce [search].
    """

    def __init__(self, parser):
        """
        Inicializace a parsing sekce [search].
        """
        try:
            self.defaults = map(int,
                parser.get("search-services", "Defaults").split(","))
        except (ConfigParser.NoOptionError, ValueError):
            dbg.log("Error parsing Defaults", ERR = 3)
            raise
        #endtry

        try:
            self.mandatory = map(int,
                parser.get("search-services", "Mandatory").split(","))
        except (ConfigParser.NoOptionError, ValueError):
            dbg.log("Error parsing Mandatory", ERR = 3)
            raise
        #endtry

        try:
            self.maxUserItems = parser.getint("search-services",
                                              "MaxUserItems")
        except ConfigParser.NoOptionError:
            self.maxUserItems = 10
            dbg.log("Error parsing MaxUserItems use default: %s",
                self.maxUserItems, WARN = 3)
        #endtry

        try:
            self.maxVisibleItems = parser.getint("search-services",
                                                 "MaxVisibleItems")
        except ConfigParser.NoOptionError:
            self.maxVisibleItems = 100
            dbg.log("Error parsing MaxVisibleItems use default: %s",
                self.maxVisibleItems, WARN = 3)
        #endtry

        try:
            self.maxTitleLength = parser.getint("search-services",
                                                "MaxTitleLength")
        except ConfigParser.NoOptionError:
            self.maxTitleLength = 10
            dbg.log("Error parsing MaxTitleLength use default: %s",
                self.maxTitleLength, WARN = 3)
        #endtry
    #enddef

    __slots__ = (
        "defaults",
        "mandatory",
        "maxUserItems",
        "maxVisibleItems",
        "maxTitleLength",
    )
#endclass


class _ConfigHttp(object):
    """
    Parser sekce [feed-discovery].
    """

    def __init__(self, parser):
        """
        Inicializace a parsing sekce [feed-discovery].
        """
        section = "feed-discovery"

        try:
            self.proxyHost = parser.get(section, "ProxyHost")
        except ConfigParser.NoOptionError:
            self.proxyHost = None
        #endtry

        try:
            self.proxyPort = parser.getint(section, "ProxyPort")
        except ConfigParser.NoOptionError:
            self.proxyPort = None
        #endtry

        try:
            self.connectTimeout = parser.getint(section, "ConnectTimeout")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError("[%s]::ConnectTimeout" % section)
        #endtry

        try:
            self.writeTimeout = parser.getint(section, "WriteTimeout")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError("[%s]::WriteTimeout" % section)
        #endtry

        try:
            self.readTimeout = parser.getint(section, "ReadTimeout")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError("[%s]::ReadTimeout" % section)
        #endtry

        try:
            self.maxResponseSize = parser.getint(section, "MaxResponseSize")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError("[%s]::MaxResponseSize" % section)
        #endtry

        try:
            self.maxResponseTime = parser.getint(section, "MaxResponseTime")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError("[%s]::MaxResponseTime" % section)
        #endtry

        try:
            self.internalMaxResponseSize = parser.getint(section,
                    "InternalMaxResponseSize")
        except ConfigParser.NoOptionError:
            self.internalMaxResponseSize = self.maxResponseSize
        #endtry
    #enddef

    __slots__ = (
        "proxyHost",
        "proxyPort",
        "connectTimeout",
        "writeTimeout",
        "readTimeout",
        "maxResponseSize",
        "maxResponseTime",
        "internalMaxResponseSize",
    )
#endclass


class _ConfigTv(object):
    """
    Parser sekce [tv].
    """

    def __init__(self, parser):
        """
        Inicializace a parsing sekce [tv].
        """
        section = "tv"

        try:
            self.defaultTvChannels = map(int,
                parser.get(section, "DefaultTvChannels").split(","))
        except (ConfigParser.NoOptionError, ValueError):
            raise lib_error.ConfigError("[%s]:DefaultTvChannels" % section)
        #endtry
    #enddef

    __slots__ = (
        "defaultTvChannels",
    )
#endclass


class _ConfigRates(object):
    """
    Parser sekce [rates].
    """

    def __init__(self, parser):
        """
        Inicializace a parsing sekce [rates].
        """
        section = "rates"

        try:
            self.defaultCurrencies = map(int,
                parser.get(section, "DefaultCurrencies").split(","))
        except (ConfigParser.NoOptionError, ValueError):
            raise lib_error.ConfigError("[%s]:DefaultCurrencies" % section)
        #endtry

        try:
            self.defaultCurrencyFeed = parser.getint(section,
                                                     "DefaultCurrencyFeed")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError("[%s]:DefaultCurrencyFeed" % section)
        #endtry

        try:
            self.defaultGasFeed = parser.getint(section, "DefaultGasFeed")
        except ConfigParser.NoOptionError:
            raise lib_error.ConfigError("[%s]:DefaultGasFeed" % section)
        #endtry
    #enddef

    __slots__ = (
        "defaultCurrencies",
        "defaultCurrencyFeed",
        "defaultGasFeed",
    )
#endclass


class _ConfigForeignEmail(object):
    """
    Parser sekce [foreignemail].
    """
    def __init__(self, parser):
        """
        Inicializace a parsing sekce [foreignemail].
        """
        section = "foreignemail"

        try:
            self.passwordKey = parser.get(section, "PasswordKey")
        except:
            raise lib_error.ConfigError("[foreignemail]:PasswordKey")
        #endtry
        self.cipherer = Cipherer(self.passwordKey)
    #enddef

    __slots__ = (
        "passwordKey",
        "cipherer",
    )
#endclass


class _ConfigSkins(object):
    """
    Parser sekce [skins].
    """

    def __init__(self, parser):
        """
        Inicializace a parsing sekce [skins].
        """
        try:
            self.userImageValidity = parser.get("skins", "UserImageValidity")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::UserImageValidity - " \
                    "setting to default", WARN = 3)
            self.userImageValidity = 3600
        #endtry

        try:
            self.userImageFormat = parser.get("skins", "UserImageFormat")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::UserImageFormat - " \
                    "setting to default", WARN = 3)
            self.userImageFormat = "JPEG"
        #endtry

        try:
            self.userImagePath = parser.get("skins", "UserImagePath")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::UserImagePath - " \
                    "setting to default", WARN = 3)
            self.userImagePath = "/favicons/skins/user/"
        #endtry
        try:
            self.userImageTempFolder = parser.get("skins",
                    "UserImageTempFolder")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::UserImageTempFolder - " \
                    "setting to default", WARN = 3)
            self.userImageTempFolder = "/favicons/skins/user/tmp/"
        #endtry

        try:
            self.userImageExt = parser.get("skins", "UserImageExt")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::UserImageExt - " \
                    "setting to default", WARN = 3)
            self.userImageExt = ".jpg"
        #endtry

        try:
            self.userImageThumbSuffix = parser.get("skins",
                    "UserImageThumbSuffix")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::UserImageThumbSuffix - " \
                    "setting to default", WARN = 3)
            self.userImageThumbSuffix = "_thumb"
        #endtry

        try:
            self.thumbnailWidth = parser.getint("skins", "ThumbnailWidth")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::thumbnailWidth - " \
                    "setting to default", WARN = 3)
            self.thumbnailWidth = 99
        #endtry

        try:
            self.thumbnailReflectionHeight = parser.getint("skins",
                    "ThumbnailReflectionHeight")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::thumbnailReflectionHeight - " \
                    "setting to default", WARN = 3)
            self.thumbnailReflectionHeight = 23
        #endtry

        try:
            self.thumbnailHeight = parser.getint("skins", "ThumbnailHeight")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::thumbnailHeight - " \
                    "setting to default", WARN = 3)
            self.thumbnailHeight = 77
        #endtry

        try:
            self.staticData = parser.get("skins", "StaticData")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::staticData - " \
                    "setting to default", WARN = 3)
            self.staticData = "/www/homepage/userweb/static"
        #endtry

        try:
            self.defaultSkinId = parser.getint("skins", "DefaultSkinId")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::defaultSkinId - " \
                    "setting to default", WARN = 3)
            self.defaultSkinId = 1
        #endtry

        try:
            self.userImageQuality = parser.getint("skins", "UserImageQuality")
        except ConfigParser.NoOptionError:
            dbg.log("Undefined [skins]::UserImageQuality - " \
                    "setting to default", WARN = 3)
            self.userImageQuality = 95
        #endtry
    #enddef

    __slots__ = (
        "userImageValidity",
        "userImageFormat",
        "userImagePath",
        "userImageTempFolder",
        "userImageExt",
        "userImageThumbSuffix",
        "thumbnailWidth",
        "thumbnailReflectionHeight",
        "thumbnailHeight",
        "staticData",
        "defaultSkinId",
        "userImageQuality",
    )
#endclass


class _ConfigCCacher(object):
    """
    Parser sekce [cookiecacher].
    """

    def __init__(self, parser):
        """
        Inicializace a parsing sekce [cookiecacher].
        """
        section = "cookiecacher"
        try:
            self.secret = parser.get(section, "Secret")
            self.expirationTime = parser.getint(section, "ExpirationTime")
            self.charsPerCookie = parser.getint(section, "CharsPerCookie")
            self.maxCookies = parser.getint(section, "MaxCookies")
            self.cPrefix = parser.get(section, "CPrefix")

        except ConfigParser.NoOptionError, e:
            raise lib_error.ConfigError, "[%s] %s" % (section, str(e))
        #endtry
    #enddef

    __slots__ = (
        "secret",
        "expirationTime",
        "charsPerCookie",
        "maxCookies",
        "cPrefix",
    )
#endclass


class _ConfigTokenGenerator(object):
    """
    Parser sekce [tokengenerator].
    """

    def __init__(self, parser):
        """
        Inicializace a parsing sekce [tokengenerator].
        """
        section = "tokengenerator"
        try:
            self.secret = parser.get(section, "Secret")
            self.expirationTime = parser.getint(section, "ExpirationTime")

        except ConfigParser.NoOptionError, e:
            raise lib_error.ConfigError, "[%s] %s" % (section, str(e))
        #endtry
    #enddef

    __slots__ = (
        "secret",
        "expirationTime",
    )
#endclass


class _ConfigMyNoSql(object):
    """
    Parser sekce [mynosql].
    """

    def __init__(self, cfgParser):
        """
        Inicializace a parsing sekce [mynosql].
        """
        section = "mynosql"
        try:
            self.saveAnonymInfo = cfgParser.getint("mynosql", "SaveAnonymInfo")
        except ConfigParser.NoOptionError:
            self.saveAnonymInfo = 0
            dbg.log("Undefined [%s]::SaveAnonymInfo, " \
                "defaults to `%s'.", (section, self.saveAnonymInfo), WARN = 3)
        #endtry
    #enddef

    __slots__ = (
        "saveAnonymInfo",
    )
#endclass


class _ConfigHintCookies(object):
    """
    Parser sekce [hintcookies].
    """

    def __init__(self, parser):
        """
        Inicializace a parsing sekce [hintcookies].
        """
        section = "hintcookies"
        try:
            self.cookies = parser.get(section, "Cookies").split(",")

        except ConfigParser.NoOptionError, e:
            raise lib_error.ConfigError, "[%s] %s" % (section, str(e))
        #endtry
    #enddef

    __slots__ = (
        "cookies",
    )
#endclass


def checkSaveAnonymInfo(default = None):
    """
    Decorator for saveAnonymInfo option - if set to 0,
    return default value in parameter.
    """
    def decorator(func):
        def wrapper(self, *__args, **__kw):
            if self.config.saveAnonymInfo:
                return func(self, *__args, **__kw)
            else:
                dbg.log("MyNoSQL: %s() saveAnonymInfo is off, " \
                    "returning default", func.__name__, WARN = 3)
                return default
            #endif
        #enddef
        return wrapper
    #enddef
    return decorator
#enddef


class _MyNoSqlFRPC(_ConfigBox):
    """
    Wrapper pro pristup k MySQL jako ke key-value ulozisti.
    Uloziste pouziva slozeny klic - uid (id uzivatele) a cid (samotny klic).
    Vsechny hodnoty jsou uladane jako retezce.
    """

    def __init__(self, config):
        """
        Konstruktor.
        """
        _ConfigBox.__init__(self, config, "mynosql")
        self.config = _ConfigMyNoSql(config)
        self.skinList = None
        self.skinListTimestamp = 0
        self.skinAttributes = {}
    #enddef

    @checkSaveAnonymInfo(0)
    def setUserValues(self, kv, userId = 0, removeOther = False):
        """
        Nastavi hodnoty pro dane klice, pokud nektery z techto klicu existuje,
        je prepsan. Pokud je dano userId nastavi hodnotu pro daneho uzivatele a vrati None,
        jinak ulozi hodnotu pod nove id uzivatele a to vrati.

        Keyword arguments:
            kv          mapa s klici/hodnotami
            userId      id uzivatele, kteremu hodnotu prirazujeme
            removeOther odstrani vsechny ostatni nastaveni z databaze

        Return
            None pokud je dano userId, pokud ne vraci id noveho uzivatele.
        """

        # zde potrebujeme kopii kv pro zapickleni,
        # jinak bychom zmenili data ktera posleze
        # pouziva CookieCacher
        kv = dict((k, dumps(v)) for k, v in kv.iteritems() \
                if k != "last_access")

        response = self.proxy.user.setValues(kv, userId, removeOther)
        if response["status"] != 200:
            raise UnexpectedResponse(self.proxy, response)
        #endif

        if not userId:
            return response["userId"]
        #enif
    #enddef

    @checkSaveAnonymInfo({})
    def getUserValues(self, userId, keys = (), modifyLastAccess = True):
        """
        Vraci pozadovane klice pro daneho uzivatele.

        Keyword arguments:
            userId      id uzivatele
            keys        n-tice klicu, ktere chceme vratit, pokud je prazdna vraci vsechny

        Return:
            {} pokud uzivatel neexistuje, jinak mapu klic:hodnota pro vsechny nalezene klice z keys
        """

        if not userId:
            return {}
        #endif

        response = self.proxy.user.getValues(userId, keys, modifyLastAccess)
        if response["status"] != 200:
            raise UnexpectedResponse(self.proxy, response)
        #endif

        result = response["result"]
        result.update((k, loads(v)) for k, v in result.iteritems() \
                if k != "last_access")
        return result
    #enddef

    @checkSaveAnonymInfo(None)
    def removeUserValues(self, userId, keys = None,
            postRemove = None, removeBut = False):
        """
        Odstrani sadu klicu daneho uzivatele z DB. Pro kazdou hodnotu
        klice zavola prislusnou funkci definovanou v parametru postRemove.

        Arguments:
            userId          id uzivatele
            postRemove      mapa klicu na odpovidajici funkci, ktera
                            bude zavolana s hodnotou tohoto klice
            keys            klice, ktere maji byt odstraneny
            removeBut       remove all but keys
        Return:
            None
        """

        if not userId:
            dbg.log("MyNoSQL: no userId to be remove", WARN = 3)
            return
        #endif

        userValues = None
        if postRemove:
            items = postRemove.iteritems()
            kgen = (key for key, action in items if callable(action))
            userValues = self.getUserValues(userId, kgen, False)
        #endif

        response = self.proxy.user.removeValues(userId, keys, removeBut)
        if response["status"] != 200:
            raise UnexpectedResponse(self.proxy, response)
        #endif

        if postRemove and userValues:
            for key, value in userValues.iteritems():
                postRemove[key](value)
            #endfor
        #endif
    #enddef

    @checkSaveAnonymInfo(None)
    def markUserToBeRemoved(self, userId):
        """
        Zmeni uzivateli v databazi last_access tak, aby ho
        cistici script odstanil.

        Args:
            userId          id uzivatele

        """

        if not userId:
            return
        #endif

        userId = int(userId)
        response = self.proxy.user.markToBeRemoved(userId)
        if response["status"] != 200:
            raise UnexpectedResponse(self.proxy, response)
        #endif
    #enddef

    def skinListActive(self):
        """
        Vrati seznam aktivnich skinu
        """

        timestamp = time.time()
        if self.skinList and (timestamp - self.skinListTimestamp) < 60.0:
            return self.skinList
        #endif
        self.skinListTimestamp = timestamp

        response = self.proxy.skin.listActive()
        if response["status"] != 200:
            raise UnexpectedResponse(self.proxy, response)
        #endif

        self.skinList = response["result"]
        return self.skinList
    #enddef

    def skinGetAttributes(self, skinId):
        """
        Vytahne z db podrobnosti o skinu s id skinId
        Attributes:
            skinId      id skinu
        Return:
            {}          zadany skin nebyl nalezen
            Skin        mapu s attr skinu 
        """
        skinId = int(skinId)
        dbg.log("MyNoSQL: getting skin attributes %d", skinId, DBG = 3)

        timestamp = time.time()
        skinAttributes = self.skinAttributes
        if skinId in skinAttributes:
            skin = skinAttributes[skinId]
            if (timestamp - skin["timestamp"]) < 60.0:
                return skin
            #endif
        #endif

        response = self.proxy.skin.getAttributes(skinId)
        if response["status"] != 200:
            raise UnexpectedResponse(self.proxy, response)
        #endif

        skin = response["result"]
        skin["timestamp"] = timestamp
        skinAttributes[skinId] = skin
        return skin
    #enddef

    __slots__ = (
        "config",
        "skinList",
        "skinListTimestamp",
        "skinAttributes",
    )
#endclass

