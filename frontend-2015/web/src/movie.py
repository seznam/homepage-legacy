#!/usr/bin/env python2.5
#
# $Id$
"""
DESCRIPTION   staticka stranka s filmy
"""

from mod_python import apache
from dbglog     import dbg
from datetime import datetime
import os

def movieScreen(req) :
    """
    Handler pro staticke filmove stranky
    """
    if req.method != "GET":
        return lib_util.redir(req, "/")
    #endif

    dbg.log("movieScreen: uri=%s", req.uri, DBG = 3)
    name = req.uri[1:]

    dataRoot = req.config.teng.createDataRoot({})
    
    is_https = req.headers_in.get("Referer", "")[:5].lower() == "https"
    baseUrl = req.config.control.baseUrlHTTPS if is_https else req.config.control.baseUrl

    if name == "kuky-se-vraci":
        name = "primy-prenos"

        if req.form.get.getfirst("film", default = "") != os.environ['MOVIE_SECRET']:
            return lib_util.redir(req, "http://www.firmy.%s/?q=%s" %
                (req.config.control.UrlTld, req.uri))
        #endif

        try:
            # vanocni pohadka

            # hodnoty z adminu
            cfg = req.config.frog.proxy.dbconfig.listAttributes(("movie_viewer",
                "movie_max_viewer", "movie_endtime", "movie_foreigners_left"))["config"]

            if int(cfg["movie_viewer"]) > int(cfg["movie_max_viewer"]):
                # moc lidi ==> presmerovat
                dbg.log("LIVE: User limit exceeded %s", cfg["movie_viewer"], INFO=3)
                return lib_util.redir(req, "%s/limit" % baseUrl)
            #endif

            '''
            # moc pripojeni na cdn
            try:
                do_redirect = True

                res = req.config.livestream.proxy.live.getStreamingStatus()
                if res["status"] == 200:
                    do_redirect = False
                #endif

            except Exception, e:
                dbg.log("LIVE: An exception has been ocured when runnig live.getStreamingStatus(): %s", str(repr(e)), ERR=4)

            finally:
                if do_redirect:
                    dbg.log("LIVE: Redirecting to /limit according to live.getStreamingStatus().", INFO=3)
                    return lib_util.redir(req, "%s/limit" % baseUrl)
                #endif
            #endtry
            '''

            # vysilame/nevysilame do tengu 
            dataRoot.addVariable("movie_live", "is_over" if datetime.now() > get_end_time(cfg) else "in_progress")

            # cizinec/necizinec - urceni
            movie_foreigner = 0
            #geo_location = req.headers_in.get("X-GeoIP-Country", "CZ")
            geo_location = req.form.get.getfirst("geoip", default = "CZ") or "CZ"
            dbg.log("LIVE: GeoIP-Country: %s", geo_location, INFO=3)
            if geo_location != "CZ":
                if int(cfg["movie_foreigners_left"]) > 0:
                    req.config.frog.proxy.dbconfig.setAttributes("movie_foreigners_left", str(int(cfg["movie_foreigners_left"]) - 1))
                else:
                    movie_foreigner = 1
                #endif
            #endif

            # cizinec/necizinec - do tengu
            dataRoot.addVariable("movie_foreigner", movie_foreigner)

            # ip adresa do tengu
            dataRoot.addVariable("user_ip", get_remote_ip(req))
        except Exception, e:
            dbg.log("Movie error: %s", str(repr(e)), ERR=4)
            return lib_util.redir(req, "%s/" % baseUrl)
        #endtry
    #endif
    
    if name == "live-playlist":
        try:
            # hodnoty z adminu
            cfg = req.config.frog.proxy.dbconfig.listAttributes(("movie_viewer",
                "movie_max_viewer", "movie_endtime", "movie_foreigners_left"))["config"]

            if int(cfg["movie_viewer"]) > int(cfg["movie_max_viewer"]) or datetime.now() > get_end_time(cfg):
                raise Exception("Streaming is over or user limit exceeded")
            #endif

            import urllib
            import socket

            socket.setdefaulttimeout(1.0)

            proxies = {'http': req.config.control.proxy}
            opener = urllib.FancyURLopener(proxies)

            remoteIp = get_remote_ip(req)
            protocol = req.form.get.getfirst("protocol", default = "rtmp")
            protocol = "jw" if protocol == "rtmp" else "smil_hls"

            f = opener.open(os.environ['LIVE_PLAYLIST_REDIRECT_URL_TEMPLATE'] % (remoteIp, protocol))

            url = f.read()
            f.close()

            return lib_util.redir(req, url)
        except Exception, e:
            dbg.log("LIVE: playlist error: %s", str(repr(e)), ERR=4)

            req.content_type = "text/plain"
            req.write("Omlouvame se, dodavatel dat ma problemy s pripojenim.")
            return apache.OK
        #endtry
    #endif

    if name == 'kuky':
        name = "dnes-vecer"
        import time
        dataRoot.addVariable("display_time", time.time())
    #endif

    if name == 'abtest-prepare':
        if req.form.get.getfirst("token", default = "") != os.environ['MOVIE_SECRET_ABTEST']:
            return lib_util.redir(req, "http://www.firmy.%s/?q=%s" %
                (req.config.control.UrlTld, req.uri))
        #endif
        req.content_type = "text/plain"
        req.write(req.config.abTest.prepare())
        return apache.OK
    #endif

    if name != 'film-na-hp':
        lib_util.generatePage(req, "%s.html" % (name), dataRoot, req.config.template.defaultLanguage, contentType = "text/html")
        return apache.OK

    return lib_util.redir(req, "/")
#enddef


def get_remote_ip(req):
    remoteIp = req.headers_in.get(req.config.control.forwardedForHeader,
        req.headers_in.get("X-Real-IP", "127.0.0.1"))
    remoteIp = lib_util.getLastIp(remoteIp)
    #dbg.log("LIVE: (%s), %s, %s", (req.headers_in.get(req.config.control.forwardedForHeader, "X"),
    #    req.headers_in.get("X-Real-IP", "X"), req.connection.remote_ip), INFO=5)
    #dbg.log("LIVE: %s, %s", (req.headers_in.get("X-GeoIP-Country", "X"),
    #    req.headers_in.get("X-GeoIP-Region", "X"), ""), INFO=5)

    # ipv6 neni podporovana
    if remoteIp.find(":") != -1: remoteIp = "127.0.0.1"
    dbg.log("LIVE: User-IP: %s", remoteIp, INFO=3)

    return remoteIp
#endif


def get_end_time(cfg):
    try:
        # cas konce primeho prenosu
        end_time = datetime.strptime(cfg["movie_endtime"], "%Y-%m-%d %H:%M:%S")
    except (ValueError, KeyError), e:
        end_time = datetime(2012, 12, 25, 6, 0)
        dbg.log("LIVE: Movie end time converting error: %s. Set to: %s", (str(repr(e)), end_time), ERR=4)
    #endtry

    return end_time
#enddef
