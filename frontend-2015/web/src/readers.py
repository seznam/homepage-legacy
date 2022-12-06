#!/usr/bin/env python2.5
#
# FILE          $Id$
#
# DESCRIPTION   Vraci statistiky ctenosti

from mod_python import apache
from dbglog     import dbg
import mx.DateTime

import fastrpc

def _checkIP(req):
    remote_ip = req.headers_in.get(req.config.control.forwardedForHeader,
            req.connection.remote_ip)
    remote_ip = lib_util.getLastIp(remote_ip)

    dbg.log("Test ip `%s' in `%s'", (remote_ip, 
        req.config.control.readersAllowedIps), INFO = 2)
    return not remote_ip in req.config.control.readersAllowedIps
#enddef

def dtdScreen(req):
    """
    Vraci dtd
    """

    # Overime ip adresu
    if _checkIP(req):
        return apache.HTTP_NOT_FOUND
    #endif

    lib_util.generatePage(req, 'readers.dtd', {}, req.userInfo.language, 
            contentType="application/xml-dtd")
    return apache.OK
#enddef

def xmlScreen(req):
    """
    Vraci xml s daty
    """

    # Overime ip adresu
    if _checkIP(req):
        return apache.HTTP_NOT_FOUND
    #endif

    # root fragment
    dataRoot = req.userInfo.createDataRoot()

    # Vytahneme skupiny
    res = req.config.frog.proxy.feed.listGroups()
    if res['status'] != 200:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
    #endif

    groups = []
    for group in res["groups"]:
        groups.append(group["groupId"])
    #endfor
        
    # Vytahneme feedy
    res = req.config.frog.proxy.listFeeds(groups)
    if res['status'] != 200:
        raise lib_error.UnexpectedResponse(req.config.frog.proxy, res)
    #endif

    for feed in res["feeds"]:
        if feed["typeId"] == "rss":
            actually = None
            feed["title"] = _xmlClean(feed["title"])
            feedFragment = dataRoot.addFragment("feed", feed)

            # Nyni ziskame weekly statistiky
            res = req.config.frog.proxy.feed.stat.weekly(feed["feedId"], 
                    fastrpc.DateTime((mx.DateTime.now() - 365 * mx.DateTime.oneDay
                        ).Format("%Y-%m-%d %H:%M:%S")),
                    fastrpc.DateTime(mx.DateTime.now().Format("%Y-%m-%d %H:%M:%S")))
            if res["status"] / 100 != 2:
                raise lib_error.UnexpectedResponse(req.config.frog.proxy, res, {})
            #endif

            for week in res["stats"]:
                if not actually or week["week"].unixTime > actually["week"].unixTime:
                    actually = week
                #endif
                feedFragment.addFragment("weekly", week)
            #endif
            if actually:
                feedFragment.addFragment("actually", {"readers": actually["readers"]})
            #endif

            # Nyni ziskame monthly statistiky
            res = req.config.frog.proxy.feed.stat.monthly(feed["feedId"], 
                    fastrpc.DateTime((mx.DateTime.now() - 365 * mx.DateTime.oneDay
                        ).Format("%Y-%m-%d %H:%M:%S")),
                    fastrpc.DateTime(mx.DateTime.now().Format("%Y-%m-%d %H:%M:%S")))
            if res["status"] / 100 != 2:
                raise lib_error.UnexpectedResponse(req.config.frog.proxy, res, {})
            #endif

            for month in res["stats"]:
                feedFragment.addFragment("monthly", month)
            #endif
        #endif
    #endfor
    
    lib_util.generatePage(req, 'readers.xml', dataRoot, req.userInfo.language, 
            contentType="application/xml")
    return apache.OK
#enddef

def _xmlClean(data):
    """
    Do xml nepatri tyto unicode znaky 
    """
    if type(data) != type(u""):
        data = unicode(data, "utf-8")
    #endif
    res = u""
    for char in data:
        if char == u"\u0009" or char == u"\u000a" or char == u"\u000d" or \
                ((char >= u"\u0020") and (char <= u"\ud7ff")) or \
                ((char >= u"\ue000") and (char <= u"\ufffd")):
            res += char
        #endif
    #endfor
    return res
#enddef

