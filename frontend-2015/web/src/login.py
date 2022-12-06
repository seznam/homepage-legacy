#!/usr/bin/env python2.5
#
# FILE          $Id$
#
# DESCRIPTION   Login and logout

from mod_python import apache
from dbglog     import dbg
import md5
import urllib
import urlparse
import cgi
import fastrpc
import types

def loginScreen(req):
    """
    Zobrazi prihlasovaci dialog
    """
    args = []
    # Muzou ale nemusi byt
    username = req.form.get.getfirst('username', str, default='')
    if username:
        args.append("username=%s" % urllib.quote_plus(username))
    #endif
    domain = req.form.get.getfirst('domain', str, default='')
    if domain:
        args.append("domain=%s" % urllib.quote_plus(domain))
    #endif
    remember = req.form.get.getfirst('remember', int, 0)
    if remember:
        args.append("remember=%s" % remember)
    #endif
    disablessl = req.form.get.getfirst('disablessl', int, 0)
    if disablessl:
        args.append("set_disableSSL=%s" % disablessl)
    #endif

    # Argumenty pro loggedURL
    loggedArgs = ['logged=1']
    url = req.form.get.getfirst('url', default='')
    if url:
        loggedArgs.append("url=%s" % urllib.quote_plus(url))
    #endif
    feedId = req.form.get.getfirst('feedId', default='')
    if feedId:
        loggedArgs.append("feedId=%s" % urllib.quote_plus(feedId))
    #endif
    goto = req.form.get.getfirst('goto', str, default='')
    if goto:
        loggedArgs.append("goto=%s" % urllib.quote_plus(goto))
    #endif

    # jeste title - nesmi to byt unicode
    title = req.form.get.getfirst('title', default='')
    if title and type(title) == type(u""):
        title = title.encode("utf-8", "replace")
        loggedArgs.append("title=%s" % urllib.quote(title))
    #endif

    # Povinne atributy
    args.append("serviceId=%s" % req.config.control.serviceId)

    cont = req.form.get.getfirst('continue', str, default='?')

    is_https = req.headers_in.get("Referer", "")[:5].lower() == "https"
    baseUrl = req.config.control.baseUrlHTTPS if is_https else req.config.control.baseUrl
    loginServer = req.config.control.loginServerHTTPS if is_https else req.config.control.loginServer

    if req.unparsed_uri == "/prihlaseni-nastaveni-obsahu":
        args.append("loggedURL=%s" % (urllib.quote_plus("%s?p=nastaveni-obsahu&logged=1" % baseUrl)))
    elif req.unparsed_uri == "/prihlaseni-nastaveni-vzhledu":
        args.append("loggedURL=%s" % (urllib.quote_plus("%s?p=nastaveni-vzhledu&logged=1" % baseUrl)))
    elif req.unparsed_uri == "/prihlaseni-nastaveni-hledani":
        args.append("loggedURL=%s" % (urllib.quote_plus("%s?p=nastaveni-hledani&logged=1" % baseUrl)))
    elif req.unparsed_uri == "/prihlaseni-nove-nastaveni":
        args.append("loggedURL=%s" % (urllib.quote_plus("%s/nove-nastaveni?logged=1" % baseUrl)))
    elif cont:
        parsedUrl = urlparse.urlparse(cont)
        qs = cgi.parse_qsl(parsedUrl.query)
        qs.append(("logged", 1))
        qs = urllib.urlencode(qs)
        args.append("loggedURL=%s" % (urllib.quote_plus("%s%s?%s#obsah" % (baseUrl, parsedUrl.path, qs))))
    else:
        args.append("loggedURL=%s" % (urllib.quote_plus("%s?" % baseUrl)
            + (urllib.quote_plus("&").join(loggedArgs))))
    #endif

    return lib_util.redir(req, "%s?%s" % (loginServer, "&".join(args)))
#endif

def loginProcess(req):
    """
    Provede prihlaseni uzivatele
    """

    # Vytahneme prihlasovaci udaje
    username  = req.form.post.getfirst('username', default='')
    password  = req.form.post.getfirst('password', default='')
    domain    = lib_util.validateDomain(req, req.form.post.getfirst('domain', default=''))
    remember  = req.form.post.getfirst('remember', default='')
    goto      = req.form.post.getfirst('goto', default='')

    # provedeme prihlaseni
    try:
        md5pass = md5.new(password).hexdigest()
    except UnicodeError:
        md5pass = md5.new(password.encode('utf-8', 'ignore')).hexdigest()
    #endtry

    remoteIp = req.headers_in.get(req.config.control.forwardedForHeader,
            req.connection.remote_ip)
    remoteIp = lib_util.getLastIp(remoteIp)

    sinfo = {
        'clientIP'  : remoteIp,
        'serviceId' : req.config.control.serviceId
        }

    if domain in ("email.cz", "post.cz"):
        sinfo["plainPassword"] = password
    #endif

    res = req.config.ubox.proxy.authUser(username, domain, md5pass, sinfo)
    
    is_https = req.headers_in.get("Referer", "")[:5].lower() == "https"
    baseUrl = req.config.control.baseUrlHTTPS if is_https else req.config.control.baseUrl

    if res['status'] != 200:
        if type(username) == types.UnicodeType:
            username = username.encode('utf-8', 'replace')
        #endif
        return lib_util.redirHTML(req, '%s/prihlaseni?badLogin=1&username=%s&domain=%s&remember=%s&goto=%s' % \
                        (baseUrl, urllib.quote_plus(username), domain, remember, goto))
    #endif

    userId = res['userId']

    # vytvor session
    res = req.config.sbox.proxy.session.create({
            'userId' : userId,
            'serviceId' : req.config.control.serviceId,
            'username'  : '%s@%s' % (username, domain),
            'clientIp'  : remoteIp,
            'userAgent' : req.headers_in.get('User-Agent', 'none'),
            'temporary' : fastrpc.Boolean(not remember),
            })
    if res['status'] != 200:
        dbg.log('Failed to create sesison for userId=%d: <%d, %s>', \
                    (userId, res['status'], res['statusMessage']), WARN=3)
        return lib_util.redirHTML(req, '%s/prihlaseni?badLogin=1&username=%s&domain=%s&remember=%s&goto=%s' % \
                        (baseUrl, username, domain, remember, goto))
    #endif

    dbg.log("Authentized userId=%d", userId, INFO=3)
    lib_util.setDSCookie(req, res["session"], remember)

    return lib_util.logged_jump(req, goto, req.form.post, '')
#enddef


def ticket(req):
    """
    Provede overeni a prihlaseni usera na zaklade ticketu
    """

    p = req.form.get.getfirst('p', default='')
    ticket = req.form.get.getfirst('ticket', default='')
    goto = req.form.get.getfirst('goto', default='')
    returnUrl = req.form.get.getfirst('returnUrl', default='')

    remoteIp = req.headers_in.get(req.config.control.forwardedForHeader,
            req.connection.remote_ip)
    remoteIp = lib_util.getLastIp(remoteIp)

    if ticket:
        res = req.config.sbox.proxy.ticket.check(ticket)
        if res['status'] == 200:
            userId = res['userId']
            remember = int(res['remember'])

            dbg.log("Valid ticket for userId=%d, remoteIp=%s", (userId, remoteIp), INFO=3)

            # zjistime info o uzivatelu
            res = req.config.ubox.proxy.user.getAttributes(userId, ("username", "domain"))
            if res['status'] != 200:
                raise lib_error.UnexpectedResponse(req.config.ubox.proxy, res)
            #endif

            username = res['userData']['username']
            domain = res['userData']['domain']

            # vytvor session
            res = req.config.sbox.proxy.session.create({
                    'userId' : userId,
                    'serviceId' : req.config.control.serviceId,
                    'username'  : '%s@%s' % (username, domain),
                    'clientIp'  : remoteIp,
                    'userAgent' : req.headers_in.get('User-Agent', 'none'),
                    'temporary' : fastrpc.Boolean(not remember),
                    })

            if res['status'] != 200:
                raise lib_error.UnexpectedResponse(req.config.sbox.proxy, res)
            #endif

            lib_util.setDSCookie(req, res["session"], remember)

            is_https = req.headers_in.get("Referer", "")[:5].lower() == "https"
            baseUrl = req.config.control.baseUrlHTTPS if is_https else req.config.control.baseUrl

            if returnUrl :
                return lib_util.redirHTML(req, "%s/%s" % (baseUrl,
                    returnUrl.replace("\n","").replace("\r","").replace("://","")))
            #endif

            return lib_util.logged_jump(req, goto, req.form.get, p)

        else:
            dbg.log("Failed to check ticket: %s", res, ERR=2)
        #endif
    #endif

    return lib_util.redir(req, '/')
#enddef


def logoutProcess(req):
    """
    Provede odhlaseni uzivatele - zrusi jeho cookie
    """

    #hid = req.form.get.getfirst('hashId', default='')
    # napred overime, ze uzivatel je autorizovan - pokud neni nebo neprislo hid
    # tak volani metody selze
    #if req.userInfo.verifyHashId(hid):
    #    remove ds cookie

    if req.userInfo.userId and req.userInfo.session:
        #close active hint wave
        hint_cookie = lib_util.getHintCookie(req)
        try:
            res = req.config.hint.proxy.hint.closeWave(hint_cookie, req.userInfo.userId)
            if res["status"] == 200:
                # update only if it makes sense
                lib_util.setHintCookie(req, res["cookie"], True)
        except (fastrpc.Fault, fastrpc.Error, fastrpc.ProtocolError, KeyError), e:
            dbg.log('Ignoring FastRPC error: %s', str(e), WARN=3)

        remoteIp = req.headers_in.get(req.config.control.forwardedForHeader,
                req.connection.remote_ip)
        remoteIp = lib_util.getLastIp(remoteIp)

        result = req.config.sbox.proxy.session.close(req.userInfo.session,
            {'serviceId' : req.config.control.serviceId,
             'clientIp'  : remoteIp,
             'userAgent' : req.headers_in.get('User-Agent', 'none')})

        if result["status"] != 200:
            raise lib_error.UnexpectedResponse(req.config.sbox.proxy, result)
        #endif

    lib_util.setDSCookie(req, "", -1)

    if req.config.control.cookieDomain[0] == ".":
        oldBetaDomain = "beta%s" % req.config.control.cookieDomain
    else:
        oldBetaDomain = "beta.%s" % req.config.control.cookieDomain
    #endif
    lib_util.setDSCookie(req, "", -1, oldBetaDomain)
    ##endif

    # jdi na homepage
    return lib_util.redirHeaders(req, '/')
#endif


def jsLogin(req):
    """
    Obveri cookie 'ds' uzivatele a pokud je ok,
    provede presmerovani na volajici sluzbu
    """

    serviceId = req.form.get.getfirst('serviceId', default='')
    dataRoot = req.config.teng.createDataRoot({})

    remoteIp = req.headers_in.get(req.config.control.forwardedForHeader,
            req.connection.remote_ip)
    remoteIp = lib_util.getLastIp(remoteIp)

    # Znama sluzba
    if serviceId in ['lide', 'sreality', 'sbazar']:
        userId = 0
        # provedeme overeni session uzivatele. V cookie mame mit DS (DurableSession)
        try:
            session = lib_util.getDSCookie(req)
            ua = req.headers_in.get('User-Agent', '')
            dbg.log("Got session: %s, ua=%s", (session, ua), DBG=1)

            if len(session):
                res = req.config.sbox.proxy.session.check(session, {
                    'clientIp'  : remoteIp,
                    'userAgent' : ua,
                    'serviceId' : serviceId
                    })

                if res['status'] == 200:
                    userId = res['userId']
                    session = res['session']
                    dbg.log("Authorized userId=%d", userId, DBG=1)

                    # Posleme do sablony vse potrebne
                    dataRoot.addFragment('autorization', {
                    'userId' : userId,
                    'session' : session,
                    'serviceId' : serviceId
                    })
                    lib_util.setDSCookie(req, session, not int(res['temporary']))

                elif res['status'] != 402:
                    dbg.log("Failed to authorize user: <%d, %s>", \
                            (res['status'], res['statusMessage']), WARN=3)
                else:
                    dbg.log("Unauthorized access", DBG=1)
                #endif
            #endif

        except AttributeError:
            dbg.log("Failed to parse cookies - Attribute error", ERR=3)
        #endtry

    # Neznama sluzba
    else:
        try:
            referer = req.headers_in['Referer']
        except KeyError:
            referer = ''
        #endtry
        dbg.log('Attempt to authorize user for uknown serviceId=%d, ip=%s, referer=%s',
                (serviceId, remoteIp, referer), WARN=3)
    #endif

    lib_util.generatePage(req, 'js_login.js', dataRoot, req.config.template.defaultLanguage,
                          contentType='text/plain',
                          responseContentType='application/x-javascript; charset=utf-8')

    return apache.OK
#endif



