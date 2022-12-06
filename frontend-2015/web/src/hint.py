#!/usr/bin/env python2.5
#
# FILE          $Id$
#
# DESCRIPTION   Hinty

from mod_python import apache
from dbglog     import dbg
import fastrpc
import re
from time import time
from base64 import encodestring
import urllib, urlparse
import md5

###############################################################################
# JavaScript calls

def jsHintExecute(req):
    """
    generic method to call when hint button is clicked 
    """
    hintId = req.form.post.getfirst("id", int, default = 0)
    if hintId == 0:
        hintId = req.form.get.getfirst("id", int, default = 0)
    # fetch hint details and based on the hint kind and it's attribute decide what to do
    try:
        res = req.config.hint.proxy.hint.getAttributes(hintId)
    except (fastrpc.Fault, fastrpc.Error, fastrpc.ProtocolError):
        return lib_util.redir(req, "/")

    if res['status'] / 100 != 2:
        return lib_util.redir(req, "/")

    if res.has_key("hint"):
        hint = res["hint"][0]
        # 1. close active wave, reason = 1(execute)
        _closeWave(req, 1)

        if hint["kind"] == 1:
            # hint s tlacitkem pridavajicim gadget
            #2. do action
            feedId = int(hint["arg1"])

            # az ted overime uzivatele;
            # pokud overeni selze na nedostupnost nektere
            # z komponent, vratime sorry homepage
            lib_userinfo.UserInfo(req, checkHashId=False)

            from hp import jsAddGadget
            return jsAddGadget(req, feedId)

        if hint["kind"] == 0:
            # 2. hint redir
            if hint.get("pass_locality", False):
                # pass user locality through `hplo'
                locality = req.userInfo.weatherFeedId
                parts = list(urlparse.urlsplit(hint["arg1"]))
                query = urlparse.parse_qs(parts[3])
                query["hplo"] = locality if locality > 0 else 99
                parts[3] = urllib.urlencode(query, doseq = True)
                hint["arg1"] = urlparse.urlunsplit(parts)
            return lib_util.redir(req, hint["arg1"])

    return lib_util.redir(req, "/")
#enddef

def jsCloseWave(req):
    """
    close wave - js version
    """

    _closeWave(req)
    # root fragment pro Teng
    dataRoot = req.userInfo.createDataRoot()
    #fixme:
    dataRoot.addFragment("result", {"status" : 200, "statusMessage" : "ok"})

    # generuj stranku
    lib_util.generatePage(req, 'js_closeWave.js', dataRoot,
                          req.config.template.defaultLanguage,
                          contentType = 'text/html',
                          responseContentType = 'application/x-javascript; charset=utf-8')

    return apache.OK

###############################################################################
# web calls

def closeWave(req, js = 0):
    """
    close active hint wave
    """
    _closeWave(req)
    return lib_util.redir(req, "/")

################################################################################
# fragment functions

def addHintContent(req, dataRoot):
    """Pridani hintu
    """
    #fixme: post?
    forceHintId = req.form.get.getfirst('hintPreview', int, default = 0)
    #fixme: post?
    pass_hash = req.form.get.getfirst('force_hash', str, default = '')

    # read the hint cookie
    hint_cookie = lib_util.getHintCookie(req)
    parsed_cookie = lib_util.parseCookie(hint_cookie)

    if parsed_cookie["status"] / 100 != 2:
        #fix broken cookie
        hint_cookie = ""
    res = {}
    now = int(time())
    delay_anonymous = 0
    hint_wait_delay = req.userInfo.hint_wait_delay

    if not req.userInfo.loggedUser and (now - int(parsed_cookie["last_login"]) < hint_wait_delay):
        delay_anonymous = 24 * 3600
        dbg.log('Delaying hint for anonymous', INFO = 1)

    dbg.log('HINT cookie int(parsed_cookie["created"]), int(parsed_cookie["last_hint"])=(%d, %d)', \
            (int(parsed_cookie["created"]), int(parsed_cookie["last_hint"])), DBG = 1)
    dbg.log('HINT setting (userId,hint_wait_delay,delay_anonymous,now,forceHintId)=(%d, %d, %d, %d, %d)', \
            (req.userInfo.userId, hint_wait_delay, delay_anonymous, now, forceHintId), DBG = 1)

    # 1. stari cookie > hint_wait_delay 
    # 2. end_wave + delay < now (splnen rozestup mezi hinty)
    # 3. end_wave > now (splnena podminka pro aktualni vlnu)
    if parsed_cookie.has_key("created") and (int(parsed_cookie["created"]) + hint_wait_delay < now) \
        and parsed_cookie.has_key("last_hint") \
        and ((int(parsed_cookie["last_hint"]) + hint_wait_delay + delay_anonymous < now) or int(parsed_cookie["last_hint"]) > now) \
        and not forceHintId:

        #get the hard_limit via dbconfig
        try:
            res0 = req.config.frog.proxy.dbconfig.getAttributes('hint_hardlimit')
            hard_limit = int(res0["config"][0]["value"])
        except:
            # some safe value
            hard_limit = 0

        # read browser cookies
        toFilter = req.config.hintCookies.cookies
        filteredCookies = lib_util.getFilteredCookiesForHint(req, toFilter)
        # hard_limit == 0 -> no requests sent to hintserver
        if hard_limit:
            # check the hint cookie against the hint server
            try:
                res = req.config.hint.proxy.hint.getHint(hint_cookie, req.userInfo.userId, req.userInfo.last_login, req.headers_in.get('User-Agent', ""), filteredCookies)
            except (fastrpc.Fault, fastrpc.Error, fastrpc.ProtocolError), e:
                dbg.log('Ignoring FastRPC error: %s', str(e), WARN = 3)
                return

            if res["status"] / 100 != 2:
                dbg.log("HINT Unexpected response(%s) from hintserver" % str(res["status"]), WARN = 3)
                return

            # update stats
            if res["status"] != 201:
                # action=0 ... zobrazeni hintu
                try:
                    req.config.hint.proxy.hint.userLog(res["hint"][0]["id"], req.userInfo.userId, res["wave"], 0)
                except (fastrpc.Fault, fastrpc.Error, fastrpc.ProtocolError), e:
                    # ignore rpc error during logging
                    dbg.log('HINT Ignoring FastRPC error: %s', str(e), WARN = 3)

            # update hint cookie
            if hint_cookie != res["cookie"]:
                # update cookie only when needed
                hint_cookie = res["cookie"]
                lib_util.setHintCookie(req, hint_cookie, True)

    elif parsed_cookie.has_key("created") and parsed_cookie.has_key("last_hint") and not forceHintId and not lib_util.getHintWaitCookie(req) \
            and ((int(parsed_cookie["created"]) + hint_wait_delay > now) \
            or (int(parsed_cookie["last_hint"]) + hint_wait_delay + delay_anonymous > now)):
        if int(parsed_cookie["last_hint"]) > now:
            next_hint = int(parsed_cookie["created"]) + hint_wait_delay - now
        else:
            next_hint = max(int(parsed_cookie["created"]), (int(parsed_cookie["last_hint"]) + delay_anonymous)) + hint_wait_delay - now

        if next_hint > 0:
            expires = 60 * 60 * 24
            #if next_hint < expires:
            #    expires = next_hint
            dbg.log("HINT setting wait cookie to: %s", str(expires), DBG = 1)
            lib_util.setHintWaitCookie(req, expires)

    if forceHintId > 0:
        # verify the hash
        res0 = req.config.frog.proxy.dbconfig.getAttributes('hint_preview_pass')
        if res0["status"] / 100 != 2:
            raise lib_error.UnexpectedResponse(req.config.hint.proxy, res0)

        hash = md5.new("%s%s" % (res0["config"][0]["value"], forceHintId)).hexdigest()
        if hash == pass_hash:
            # fetch hint
            res = req.config.hint.proxy.hint.getAttributes(forceHintId)
            if res["status"] / 100 != 2:
                raise lib_error.UnexpectedResponse(req.config.hint.proxy, res)

    if res.has_key("hint") and res["hint"]:
        # post process the body of hint and render the url which should be present in arg1
        #arg1 ... url
        #body ... text with possible <url> tags
        p = re.compile('<url>(.*)</url>')
        res["hint"][0]["body"] = p.sub('<a href=\"/jsHintExecute?id=%s\">\\1</a>' % str(res["hint"][0]["id"]), res["hint"][0]["body"])

        dataRoot.addFragment("hint", res)

    # if we got empty cookie we should return "initial" cookie(and wait for hint_wait_delay) - see lib_util.parseCookie
    if len(hint_cookie) == 0:
        initial_cookie = "%s,%s;" % (str(parsed_cookie["created"]), str(parsed_cookie["last_login"]))
        lib_util.setHintCookie(req, encodestring(initial_cookie).replace("\n", ""), True)

#enddef

################################################################################
# helpers

def _closeWave(req, reason = 2):

    lib_userinfo.UserInfo(req, checkHashId = False)

    hint_cookie = lib_util.getHintCookie(req)

    parsed_cookie = lib_util.parseCookie(hint_cookie)
    try:
        last_hint = parsed_cookie["hints"][-1]
    except IndexError:
        return

    try:
        res = req.config.hint.proxy.hint.closeWave(hint_cookie, req.userInfo.userId)
    except (fastrpc.Fault, fastrpc.Error, fastrpc.ProtocolError), e:
        dbg.log('Ignoring FastRPC error: %s', str(e), WARN = 3)
        return

    if res["status"] / 100 != 2:
        dbg.log("Unexpected response(%s) from hintserver" % str(res["status"]), ERR = 3)

    #zalogovani do statistik
    # action=2 ...ukonceni hintu
    try:
        req.config.hint.proxy.hint.userLog(last_hint["hintid"], req.userInfo.userId, last_hint["waveid"], reason)
    except (fastrpc.Fault, fastrpc.Error, fastrpc.ProtocolError), e:
        dbg.log('HINT Ignoring FastRPC error: %s', str(e), WARN = 3)
        pass

    if res["status"] == 200:
        # update only if it makes sense
        lib_util.setHintCookie(req, res["cookie"], True)


