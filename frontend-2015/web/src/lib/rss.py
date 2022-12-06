#!/usr/bin/env python2.5
#
# FILE          $Id$
#
# DESCRIPTION   RSS discovery module

import re
from dbglog import dbg
from sgmllib import SGMLParser
import web_publisher

import lib.httpproxy
import lib.feedparser
import lib.error

class LinkParser(SGMLParser):
    
    def __init__(self, *args, **kwargs):
        SGMLParser.__init__(self, *args, **kwargs)
        self.feeds = []
        self.charset = ""
    #endef

    def reset(self):
        SGMLParser.reset(self)
        self.feeds = []
        self.charset = ""
    #endef

    def do_meta(self, attrs):
        if ('http-equiv', 'Content-Type') in attrs:
            for attr in attrs:
                if attr[0] == "content":
                    try:
                        self.charset = re.search("charset=['\"]?([^\s,'\"]*)['\"]?",
                                attr[1]).groups(1)[0]
                    except:
                        # chyby nas netrapi, but tam charset je, nebo neni...
                        pass
                    #endtry
                #endif
            #endfor
        #endif
    #enddef

    def do_link(self, attrs):
        # Je to rss auto discovery link?
        #
        # priklad: <link rel="alternate" type="application/rss+xml" title="RSS" 
        #           href="http://yoursite.com/rss.xml"> 
        #
        # Jeste je stary styl
        #
        # priklad: <link rel="alternate" type="application/rss+xml" title="RSS" 
        #           href="http://yoursite.com/rss.xml"> 
        #
        if not ("rel", "alternate") in attrs:
            return
        #endif
        if not ("type", "application/rss+xml") in attrs and \
           not ("type", "text/xml") in attrs:
            return
        #endif

        href = ""
        title = ""
        # Vytahneme si href        
        for attr in attrs:
            if attr[0] == "href":
                href = attr[1]
            elif attr[0] == "title":
                title = attr[1]
            #endif
        #endfor

        # Pridame je na konec feeds
        if href:
            self.feeds.append({"href": href, "title": title})
        #endif
    #enddef

    # pylint: disable-msg=W0613
    def end_head(self, attrs):
        self.setnomoretags()
    #enddef
    # pylint: enable-msg=W0613

    start_body = end_head

    def recode(self, charset):
        feeds = []

        # Prekodujeme danym charsetem do unicode
        for feed in self.feeds:
            feed["title"] = unicode(feed["title"], charset[0], charset[1])
            feeds.append(feed)
        #endfor

        return feeds
    #enddef

    def expandHref(self, baseUrl, basePath):
        feeds = []

        for feed in self.feeds:
            # Podivame se zda se jedna o relativni nebo absolutni url
            # ci je urcen i server
            if feed["href"].find("://") > 0:
                # Absolutni se serverem
                feeds.append(feed)
            elif len(feed["href"]) > 0 and feed["href"][0:1] == '/':
                # Absolutni na serveru
                feeds.append({"href": baseUrl + feed["href"], "title": feed["title"]})
            else:
                # Relativni
                feeds.append({"href": baseUrl + basePath + '/' + feed["href"],
                        "title": feed["title"]})
            #endif
        #endfor
        return feeds
    #endif

    def getFeeds(self, baseUrl, basePath):
        self.feeds = self.expandHref(baseUrl, basePath)

        dbg.log("Convert %d feeds.", (len(self.feeds)), INFO = 1)

        if self.charset:
            try:
                return self.recode((self.charset, "strict"))
            except:
                # Chyba nejde to :(
                pass
            #endtry
        #endif

        # zkusime to dokud to neprojde
        charsetlist = (
                ("utf-8", "strict"),
                ("windows-1250", "strict"),
                ("us-ascii", "replace"))
        for charset in charsetlist:
            try:
                return self.recode(charset)
            except:
                # Porad ne :(
                pass
            #endtry
        #endfor

        # title nejde prekodovat, tak je tam radsi nedame
        feeds = []
        for feed in self.feeds:
            feeds.append({
                    "href": feed["href"],
                    "title": unicode(feed["href"], "iso-8859-1")
                    })
        #endfor

        return feeds
    #enddef

#endclass


def check(req, url):
    result = []
    lib_error = web_publisher.importModule(req, 'lib.error')

    try:
        # Stahneme si source
        data = lib.httpproxy.get(url, None, None, None, req.config)
        source = data["data"]
        charset = data["charset"]

        # No a zkusime ho naparsovat
        dbg.log("FeedParser started.", INFO=2)
        feed = lib.feedparser.parse(source)
        dbg.log("FeedParser finished.", INFO=2)

        # Test pres bozo, z feed parseru nevylitavaj vyjimky...
        if feed.bozo == 1 and len(feed["items"]) == 0:
            dbg.log("Error while parse source: `%s'", (feed.bozo_exception), WARN=1)

            # Nejde to tak zkusime najit rss, pomoci feed discovery
            dbg.log("Search by rss discovery: %s", url, INFO=1)
            (scheme, host, port, path) = lib.httpproxy.parseUrl(url)
            result = discovery(source, scheme, host, port, path, charset)

        else:

            # url je rss
            result.append({"href": url, "title": url})

            # Pridame title a vratime feed
            try:
                result[0]["title"] = feed['feed']['title']
            except:
                pass
            #entry
        #endif

    except lib.error.ResponseIsTooBig, msg:
        dbg.log("RSS data error: %s", msg, ERR=3)
        raise

    except lib.error.MessageError, msg:
        dbg.log("RSS data error: %s", msg, ERR=3)

    except:
        # nepovedlo se, zalogujeme chybu a vratime,
        # ze si s tim neumime poradit
        dbg.log("RSS error: %s", (lib_error.getExceptionString()), ERR=3)

    #endtry

    # Vraci vzdy pole struktur {"href": string, "title": unicode}
    return result
#enddef


def discovery(source, scheme, host, port, path, charset):
    # Slozime baseUrl
    baseUrl = "%s://%s:%s" % (scheme, host, port)
    basePath = path[0:path.rfind('/')].lstrip('/')

    # Vytvorime si parser
    try:
        parser = LinkParser()
        parser.feed(source)
    except:
        # Muze se neco naparsovat a pak teprve to spadne...
        pass
    #endtry

    # Nastavime defaultni charset z hlavicek
    parser.charset = charset

    #Vytahneme data a vratime je
    return parser.getFeeds(baseUrl, basePath)
#enddef   

