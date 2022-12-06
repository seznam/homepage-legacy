#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# $Id$

"""
DESCRIPTION   Tento skript slouzi k aktualizaci cache vychozich feedu.
"""

import fastrpc
import dbglog
import sqlite3
import ConfigParser
import sys
import time
from cPickle import dumps, loads

exitFailure = 1
exitSuccess = 0

class Config(object):
    """
    Konfigurace pro dany modul.
    
    NB: Nemuzeme prevzit konfiguracni tridy z userwebu
    protoze skript neni spousten v kontextu apache.
    """

    class Parser(object):
        """
        Wrapper ConfigParseru.
        """

        def __init__(self, files):
            """
            Nacte konfiguracni soubor.
            """

            filenames = set(files)

            # parse config
            self.__parser = ConfigParser.ConfigParser()
            successFilenames = set(self.__parser.read(filenames))
            if successFilenames != filenames:
                raise ConfigParser.ParsingError("Can't read: %s"\
                    % repr(tuple(filenames - successFilenames)))
            #endif
        #enddef

        def getInt(self, section, option, default = None):
            """
            Vrati konfiguracni hodnotu typu `int'.
            """

            try:
                return self.__parser.getint(section, option)
            except ConfigParser.NoOptionError:
                if default == None:
                    dbglog.dbg.log("Undefined [%s]::%s'",
                        (section, option), ERR = 3)
                    raise
                #endif
            #endtry
            dbglog.dbg.log("Undefined [%s]::%s', using `%s'",
                (section, option, default), WARN = 3)
            return default
        #enddef

        def getStr(self, section, option, default = None):
            """
            Vrati konfiguracni hodnotu typu `string'.
            """

            try:
                return self.__parser.get(section, option)
            except ConfigParser.NoOptionError:
                if default != None:
                    return default
                else:
                    raise
                #endif
            #endtry
        #enddef

        def getList(self, section, option, default = None):
            """
            Vrati konfiguracni hodnotu typu `list'.
            """

            try:
                opt = self.__parser.get(section, option)
                return map(lambda x: x.strip(), opt.split(","))
            except ConfigParser.NoOptionError:
                if default == None:
                    dbglog.dbg.log("Undefined [%s]::%s'",
                        (section, option), ERR = 3)
                    raise
                #endif
            #endtry
            dbglog.dbg.log("Undefined [%s]::%s', using `%s'",
                (section, option, default), WARN = 3)
            return default
        #enddef

        def get(self, section, option):
            """
            Nektere konfiguracni tridy pouzivaji `parser::get'
            namisto `parser::getStr'.
            """

            return self.getStr(section, option)
        #enddef

        def getFeedDefaults(self, section, option, default = None):
            """
            Vrati zeznam vychozich feedu definujici jejich id a umisteni.
            """

            defaults = self.getStr(section, option, default)

            feedUnpack = lambda packedFeed: \
                dict(zip(("feedId", "column", "row", "rowCount"),
                    map(int, packedFeed.split(":"))))
            try:
                feedDefaults = map(feedUnpack, defaults.split(","))
                feedDefaults.sort(key = lambda x: (x["column"], x["row"]))
            except:
                dbglog.dbg.log("Error parsing feed defaults: %s",
                    defaults, WARN = 3)
                raise
            #endtry

            return tuple(feedDefaults)
        #enddef

        def getFeedIdsFromMap(self, section):
            """
            Extraguje idecka z definicniho seznamu feedu.
            """

            return tuple(int(v) for k, v in self.__parser.items(section) if k)
        #enddef
    #endclass

    def __init__(self):
        """
        Inicializace konfigurace pro dany modul.
        """

        dbglog.dbg.stderr(True)


        parser = Config.Parser((
            "__TARGET__/conf/homepage.conf.dev",
            "__TARGET__/conf/homepage.passwd.conf.dev"
        ))

        self.control = ConfigControl(parser)
        self.feeds = ConfigFeeds(parser)
        self.frog = ConfigBox(parser, "frog")

        if self.control.log:
            dbglog.dbg.file(self.control.log)
        #endif
        dbglog.dbg.mask(self.control.logMask)
        dbglog.dbg.stderr(False)
    #enddef
#endclass

class ConfigControl(object):
    """
    Parser sekce [control].
    """

    def __init__(self, parser):
        """
        Nacte nastaveni dbglogu.
        """

        self.log = parser.getStr("control", "Log", "")
        self.logMask = parser.getStr("control", "LogMask", "I3W2E2F1")
    #enddef
#endclass

class ConfigFeeds(object):
    """
    Parser sekce [feeds].
    """

    def __init__(self, parser):
        """
        Nacte nastaveni pro vychozi feedy.
        """

        self.mappingFile = parser.getStr("feeds", "MappingFile")
        self.feedListBaseUrl = parser.getStr("feeds", "FeedListBaseUrl", "")
        self.defaultCount = parser.getInt("feeds", "DefaultCount", 5)
        self.defaults = parser.getFeedDefaults("feeds", "Defaults")
        self.cached = ConfigFeedsCached(parser)
        self.rates = ConfigRates(parser)

        mappingParser = Config.Parser((self.mappingFile,))
        self.weatherFeedIds = mappingParser.getFeedIdsFromMap("weather")
        self.zodiacFeedIds = mappingParser.getFeedIdsFromMap("zodiac")
    #enddef

    def getIds(self):
        """
        Vrati seznam idecek vychozich feedu.
        """

        return map(lambda x: x["feedId"], self.defaults)
    #enddef

    def getAllIds(self):
        """
        Vrati zeznam vychozich feedu vcetne systemovych.
        """

        return tuple(
            set(self.getIds())
            | set(self.weatherFeedIds)
            | set(self.zodiacFeedIds)
            | set((self.rates.defaultCurrencyFeed,
                  self.rates.defaultGasFeed))
            | set(self.cached.mostUsed)
        )
    #enddef

    def getMap(self):
        """
        Vrati slovnik definici feedu indexovatelny idackama techto feedu.
        """

        return dict(map(lambda x: (x["feedId"], x), self.defaults))
    #enddef
#endclass

class Profiler(object):
    """
    Trida slouzici k profilovani sqlite3
    """

    def __init__(self, connection):
        self.__connection = connection
    #enddef

    def execute(self, sql, parameters = None):
        """
        Wrapper na execute funkci clienta 
        """
        if parameters:
            startExecution = time.time()
            retval = self.__connection.execute(sql, parameters)
        else:
            startExecution = time.time()
            retval = self.__connection.execute(sql)
        #endif
        dbglog.dbg.log("SQLite3 profiler: Query '%s...' \
                        time=%fms" % (sql[:30],
                      (time.time() - startExecution) * 1000),
                       DBG = 1)
        return retval
    #enddef

    def __getattr__(self, name):
        return getattr(self.__connection, name)
    #enddef
#endclass

class ConfigFeedsCached(object):
    """
    Parser sekce [feeds-cached].
    """

    __slots__ = ("database", "compressed", "connection", "profiler",
                 "mostUsed", "update", "updated", "skipped")

    def __init__(self, parser):
        """
        Vytvori SQLite3 spojeni.
        Dale provede detekci, zda cache vytvarime ci aktializujeme.
        """

        # inicializace
        self.database = None
        self.mostUsed = None
        self.profiler = None
        self.compressed = None

        self.readConfig(parser)

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
                self.connection = Profiler(self.connection)
            #endeif

            table = self.connection.execute("""
                SELECT `name` FROM `sqlite_master`
                    WHERE `type`='table' AND `name`='feed'
            """).fetchone()
            if not table:
                self.update = False
                self.connection.execute("""
                    CREATE TABLE IF NOT EXISTS `feed` (
                        `id` INTEGER PRIMARY KEY,
                        `last_update` INTEGER DEFAULT 0,
                        `data` BLOB NOT NULL
                    )
                """)
                self.connection.execute("""
                    CREATE TABLE IF NOT EXISTS `last_update` (
                        `id` INTEGER PRIMARY KEY,
                        `timestamp` INTEGER DEFAULT 0
                    )
                """)
            else:
                self.update = True
            #endif
        except:
            raise Exception, '[feeds-cached]::connection'
        #endtry

        self.updated = []
        self.skipped = []
    #enddef

    def readConfig(self, parser):
        """
        Nacte nastaveni pro pripojeni do sqlite db
        """

        try:
            self.database = parser.get("feeds-cached", "Database")
        except ConfigParser.NoOptionError:
            self.database = "/www/homepage/userweb/cache/cache.db"
            dbglog.dbg.log("Undefined [feeds-cached]::Database, "
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
            dbglog.dbg.log("Undefined [feeds-cached]::compressed, "
                    "using `%s'", self.compressed, WARN = 3)
        #endtry

        try:
            profiler = parser.get("feeds-cached", "Profiler")
            profiler = {
                "Enabled": True, "True": True, "Yes": True, "On": True,
                "Disabled": False, "False": False, "No": False, "Off": False,
            }.get(profiler, None)
            if profiler == None:
                raise ConfigParser.NoOptionError("Profiler", "feeds-cached")
            #endif
            self.profiler = profiler
        except ConfigParser.NoOptionError:
            self.profiler = False
            dbglog.dbg.log("Undefined [feeds-cached]::profiler, "
                    "using `%s'", self.profiler, WARN = 3)
        #endtry

        mostUsed = parser.getList("feeds-cached", "MostUsed", ())
        try:
            self.mostUsed = tuple(map(int, mostUsed))
        except ValueError:
            dbglog.dbg.log("Mailformed definition of [feeds-cached]::MostUsed,"
                    " using `()'", WARN = 3)
            self.mostUsed = ()
        #endtry

    def __setitem__(self, key, value):
        """
        Pretizeni operatoru [].

            cached[feedId] = feed

        """

        lastUpdate = 0
        value = self.safeTypes(value)
        if "weatherLastUpdate" in value:
            lastUpdate = value["weatherLastUpdate"]
        else:
            lastUpdate = value["lastUpdate"]
        #endif

        if self.update:
            sql = "UPDATE `feed` SET `last_update`=?, `data`=? "\
                "WHERE `id`=? AND (`last_update` = 0 OR `last_update` < ?)"
            args = (lastUpdate, value, key, lastUpdate)
        else:
            sql = "INSERT INTO `feed`(`id`,`last_update`,`data`) VALUES(?,?,?)"
            args = (key, lastUpdate, value)
        #endif
        try:
            cursor = self.connection.execute(sql, args)
        except:
            self.connection.rollback()
        else:
            self.connection.commit()
            if cursor.rowcount:
                self.updated.append(key)
            else:
                self.skipped.append(key)
            #endif
        #endtry
    #enddef

    def getTimestamp(self):
        """
        Selects lastupdate timestamp
        """

        timestamp = 0
        try:
            sql = "SELECT `timestamp` FROM `last_update` WHERE `id` = 1"
            row = self.connection.execute(sql).fetcone()
            if row:
                timestamp = int(row[0])
            #endif
        except:
            self.connection.rollback()
        else:
            self.connection.commit()
        #endtry
        return timestamp
    #enddef

    def setTimestamp(self, timestamp):
        """
        Replace lastupdate timestamp
        """

        sql = "INSERT OR REPLACE INTO `last_update` VALUES(1,?)"
        try:
            self.connection.execute(sql, (timestamp,))
        except:
            self.connection.rollback()
        else:
            self.connection.commit()
        #endtry
    #enddef

    def conv(self, value):
        """
        Kenverze typu.
        """

        func = {
            fastrpc.Boolean:lambda x: not not x,
            fastrpc.DateTime:lambda x: x.unixTime,
        }.get(type(value), None)
        if func:
            return func(value)
        #endif
        return value
    #enddef

    def safeTypes(self, feed):
        """
        Zajisti format dat pro cPickle.
        """

        return dict((k, self.conv(v)) for k, v in feed.iteritems())
    #enddef

    def logStats(self):
        """
        Zapise info o aktualizovanych feedech do logu.
        """

        dbglog.dbg.log("Cached feeds %s updated successfully. "\
            "The following feeds %s are ommited, "\
            "because contains actual data.",
            (self.updated, self.skipped), INFO = 1)
    #enddef
#endclass

class ConfigRates(object):
    """
    Parser sekce [rates].
    """

    __slots__ = ("defaultCurrencies", "defaultCurrencyFeed", "defaultGasFeed")

    def __init__(self, parser):
        """
        Nastaveni pro kurzy men a ceny PHM.
        """

        self.defaultCurrencies = parser.getList("rates", "DefaultCurrencies",
                                                (1, 2, 3, 4))
        self.defaultCurrencyFeed = parser.getInt("rates",
                                                 "DefaultCurrencyFeed", 13)
        self.defaultGasFeed = parser.getInt("rates", "DefaultGasFeed", 196)
    #enddef
#endclass

class ConfigBox(object):
    """
    Konfiguracni trida pripojeni k FRPC serveru
    """

    def __init__(self, parser, section):
        """
        Inicializace a parsing sekce [section]
        definujici nastaveni XMLRPC/FRPC serveru
        """

        self.address = parser.getStr(section, "Address")
        self.connectTimeout = parser.getInt(section, "ConnectTimeout", 1000)
        self.readTimeout = parser.getInt(section, "ReadTimeout", 3000)
        self.writeTimeout = parser.getInt(section, "WriteTimeout", 5000)
        self.keepAlive = parser.getInt(section, "KeepAlive", 0)
        self.useBinary = parser.getInt(section, "TransferMode", 0)

        self.proxy = fastrpc.ServerProxy(
            self.address,
            connectTimeout = self.connectTimeout,
            readTimeout = self.readTimeout,
            writeTimeout = self.writeTimeout,
            keepAlive = self.keepAlive,
            useBinary = self.useBinary
        )
    #enddef
#endclass

if __name__ == "__main__":
# Aktualizace cache pro vychozi feedy.

    config = Config()
    try:
        feedIds = config.feeds.getAllIds()
        res = config.frog.proxy.feed.getContentList(feedIds)
        if res["status"] == 200:
            for feedContent in res["feeds"]:
                if "weatherFeedId" in feedContent:
                    config.feeds.cached[feedContent["weatherFeedId"]] = \
                        feedContent
                else:
                    config.feeds.cached[feedContent["feedId"]] = feedContent
                #endif
            #endfor
            config.feeds.cached.setTimestamp(int(time.time()))
            config.feeds.cached.logStats()
        else:
            raise Exception, res["statusMessage"]
        #endif
    except Exception, e:
        dbglog.dbg.log("Failed to update feed cache %s.", e, ERR = 1)
        sys.exit(exitFailure)
    #endtry
    sys.exit(exitSuccess)
#endif

