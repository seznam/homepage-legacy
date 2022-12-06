#!/usr/bin/env python2.5
#
# FILE          $Id$
#
# DESCRIPTION   Utilities

from mod_python import apache
import Cookie
from dbglog     import dbg
from base64     import decodestring
from time       import time

import os
import socket
import re
#import time
import zlib
import urllib
import types
import adns, ADNS
import StringIO
import random
import ContentCleaner
import base64
from string import maketrans
from cookieencrypt import CookieEncrypt
import md5
import mx.DateTime
from datetime import datetime, timedelta

from re import compile
notePattern = compile("([\s])(((http|https|ftp)://){0,1}[0-9a-zA-Z\-\.]+\.[a-zA-Z]{2,5}(\:[0-9]{1,5}){0,1}(/[\S]*)*)")
mailPattern = compile("([\s])([a-zA-Z][a-zA-Z0-9\.\-\_]*@[a-zA-Z0-9][a-zA-Z0-9\.\-\_]*\.[a-zA-Z]{2,5})")
#mailPattern = compile("([\s])([\w]+([\w._#/ +$%=-][\w]+)*@[\w]+([\w.-]+[\w]+)*\.[\w]{2,5})")


def _jsafe(data):
    if data == "\\":
        return "\\\\"
    #endif

    prev = ""
    out = ""
    for char in data:
        if (char == "'") and (prev != "\\"):
            out += "\\"
        #endif

        if char in ("\r", "\n"):
            out += " "
        else:
            out += char
        #endif

        prev = char
    #endif

    return out
#ennddef


def redir(req, url):
    """
    Provede presmerovani na zadanou stranku a vraci apache.HTTP_MOVED_TEMPORARILY
    """
    dbg.log("Redirecting to `%s'", url, INFO=1)

    # Vypis nove url
    if url.startswith("/"):
        url = "%s%s" % (get_base_url(req), url)
    #enddef
    req.headers_out.add('Location', url)  # urllib.quote(url.encode("utf-8"), safe=":/"))

    req.status = apache.HTTP_MOVED_TEMPORARILY
    return apache.OK
#enddef


def redirHeaders(req, url):
    """
    Provede presmerovani na zadanou stranku formou nastaveni req.status a vyhozeni
    vyjimky. Tim se odeslou i pripadne nastavene hlavicky
    """
    dbg.log("Redirecting to `%s'", url, INFO=1)

    # Vypis nove url
    if url.startswith("/"):
        url = "%s%s" % (get_base_url(req), url)
    #enddef
    req.headers_out.add('Location', url)

    req.status = apache.HTTP_MOVED_TEMPORARILY
    raise apache.SERVER_RETURN, apache.OK
#enddef


def redirHTML(req, url):
    """
    Provede presmerovani na zadanou stranku formou META HTTP-EQUIV
    """
    dbg.log("Redirecting to `%s'", url, INFO = 1)

    req.content_type = 'text/html'
    req.write('<html><head><meta HTTP-EQUIV="refresh" content="0; url=%s"></head><body><a href="%s">&rarr;</a></body></html>' % (url, url))
    return apache.OK
#enddef


def validateLanguage(req, language):
    """
    Kontroluje zda je jazyk sluzbou podporovany.
    Pokud neni, vraci defaultni hodnotu uvedenou v konfiguraci.
    """

    if language in req.config.template.supportedLanguages:
        return language
    #endif

    return req.config.template.defaultLanguage
#enddef


def validateDomain(req, domain):
    """
    Kontroluje zda je domenu sluzbou podporovanu
    Pokud neni, vraci defaultni hodnotu uvedenou v konfiguraci.
    """

    if domain in req.config.control.availableDomains:
        return domain
    #endif

    return req.config.control.defaultDomain
#enddef


def generatePage(req, page, data, lang, contentType = 'text/html', responseContentType = None, encoding = 'utf-8', sanitizeTeng = False):
    """
    Vytvori vystup dle zadane sablony
    """

    req.headers_out.add("X-XRDS-Location", "http://id.seznam.cz/yadis")

    if responseContentType:
        req.content_type = responseContentType
    else:
        req.content_type = contentType

    outputFile = req
    try:
        if req.nocontent:
            outputFile = StringIO.StringIO()
            dbg.log("Not Content detected. Using /dev/null as teng output.", WARN=1)
        elif sanitizeTeng:
            outputFile = StringIO.StringIO()
        #endif
    except Exception:
        pass
    #endtry

    device = req.headers_in.get("X-Cd-Device", "desktop")
    if device.lower() not in ("desktop", "tablet", "phone"):
        device = "desktop"
    #endif
    data.addVariable("device", device.lower())

    device_os = req.headers_in.get("X-Cd-Device-OS", "")
    if device_os.lower() not in ("android", "ios"):
        device_os = ""
    #endif
    data.addVariable("device_os", device_os.lower())

    resp = getCookie(req, "hp_responsive", "on")
    if resp not in ("on", "off"):
        resp = "on"
    #endif
    data.addVariable("hp_responsive", resp)

    data.addVariable("sbrowser", getCookie(req, "sbrowser", 0))

    data.addVariable("scheme", req.headers_in.get("X-Scheme", "http"))

    res = req.config.teng.generatePage(
        templateFilename=page,
        dictionaryFilename=req.config.template.dict,
        configFilename=req.config.template.config,
        language=lang,
        data=data,
        outputFile=outputFile,
        encoding=encoding,
        contentType=contentType)

    if sanitizeTeng:
        output = re.sub(r'\&lt;\?', r'<?', outputFile.getvalue())
        output = re.sub(r'\?\&gt;', r'?>', output)
        req.write(output)

    #### FIXME tohle dat pryc
    ###dbgres = req.config.teng.generatePage(templateString = "<?teng debug?>",
    ###                                      configFilename = "%s-debug" % req.config.template.config,
    ###                                      data = data)
    ###dbg.logBufSize(1048576)
    ###dbg.log("Teng debug:\n[3;32m%s[m\n\n", dbgres["output"].replace("&quot;", "\""), INFO = 4)
    #### /FIXME


    # log if error
    for error in res['errorLog']:
        dbg.log("%s:%s:%s: %s", (error['filename'], error['line'], error['column'], \
            error['message']), ERR = 2)
    #endfor
#enddef


def addScreenFlags(fieldStorage, dataRoot):
    """
    Prida do root fragmentu nove fragmenty v zavislosti na tom,
    jake standardni parametry do stranky prisly. Rozpoznava
    paramerty
      saved
      backendError
    """

    # pridame priznak ulozeni
    if fieldStorage.getfirst('saved', default = ''):
        dataRoot.addFragment('saved', {})
    #endif

    # pridame priznak backendove chyby
    if fieldStorage.getfirst('backendError', default = ''):
        dataRoot.addFragment('backendError', {})
    #endif
#enddef



# DNS query enfine
# prevzato ze stare webovky
class DnsQueryEngine(ADNS.QueryEngine):
    """
    DNS query engine can answer ptr requests (addr->fqdn).
    """
    def __init__(self, timeout = 1, avaible_cname_recursion = 1):
        ADNS.QueryEngine.__init__(self)
        self.timeout = timeout
        self.avaible_cname_recursion = avaible_cname_recursion

    def submit_A(self, qname):
        if not hasattr(self, 'A_results'):
            self.A_results = {}
            self.PTR_results = {}
            self.A_results[qname] = ()
            dbg.log("DNS: Query for: %s" % qname, INFO = 1)
            self.submit(qname, adns.rr.A, callback = self.A_callback)

    def A_callback(self, answer, qname, rr, flags, extra):
        dbg.log("DNS: We get answer=`%s' code=`%s'" % (str(answer[3]), str(answer[0])), INFO = 2)
        if answer[0] in (adns.status.ok, adns.status.nodata, adns.status.nxdomain):
            self.A_results[qname] = answer[3]
        elif answer[0] == adns.status.prohibitedcname:
            cname = answer[1]
            dbg.log("DNS: We found CNAME. New query run for `%s'." % str(cname), INFO = 3)
            if self.avaible_cname_recursion <= 0:
                dbg.log("DNS: Not avaible cname recursion, probably cname cycle?", WARN = 2)
                self.A_results[qname] = answer[3]
            else:
                dns = DnsQueryEngine(self.timeout, self.avaible_cname_recursion - 1)
                dns.submit_A(str(cname))
                dns.run(self.timeout)
                if len(dns.A_results[cname]) > 0:
                    self.A_results[qname] = dns.A_results[cname]
                else:
                    self.A_results[qname] = ()

    def submit_PTR(self, qname):
        """
        """
        dbg.log("DNS: starting lookup of address '%s'", qname, INFO = 1)
        self.PTR_result = ""
        self.submit_reverse(qname, adns.rr.PTRraw, callback = self.PTR_callback)
    #enddef


    def PTR_callback(self, answer, qname, rr, flags, extra):
        if answer[0] in (adns.status.ok, adns.status.nodata,
                adns.status.nxdomain):
            if len(answer[3]) > 0:
                self.PTR_result = answer[3][0]
                dbg.log("DNS: lookup succeed: '%s'->'%s'",
                        (qname, self.PTR_result), INFO = 2)
            else:
                dbg.log("DNS: lookup succeed: '%s' is unknown", qname, INFO = 2)
        else:
            dbg.log("DNS: lookup failed", INFO = 2)
    #endef
#endclass


def checkSource(req, url):
    """
    Overi, zda zadany RSS zdroj je validni. Vraci jmeno RSS zdroje nebo None
    """

    url = url.strip()
    if not re.match(r'^https?:[/]{2}([\w-]*[.])+[a-z]{2,5}(:[0-9]{1,5}){0,1}(/[%,\w.&?;=+-]*)*$', url):
        dbg.log("Url `%s' does not match our regular expresion.",
                (url,), WARN=2)
        return None
    #endif

    # vytahneme hostname
    (x, y) = urllib.splithost(url[(6 if url.startswith("https://") else 5):])
    dbg.log('Parsed (%s, %s) from user url', (x, y), DBG = 1)
    (hostname, port) = urllib.splitport(x)
    dbg.log('Parsed (%s, %s) from url hostname', (hostname, port), DBG = 1)

    # pokus se resolvit hostname
    #dns = DnsQueryEngine()
    #dns.submit_A(hostname)
    #dns.run(1)

    try:
        socket.gethostbyname(hostname)
    except socket.gaierror:
        return None
    #endtry

    #if not len(dns.A_results[hostname]):
    #    dbg.log("Cannot reslve hostanme `%s'.", (hostname, ), WARN=2)
    #    return None
    #endif

    return url
#enddef


def idToHash(id):
    return "%u" % zlib.crc32(os.environ['ID_HASH_CRC_INPUT_TEMPLATE'] % (id))
#enddef


def lide_idToHash(id):
    """
    pouze pro lide
    """
    # make id hexa string
    id = "%08X" % id
    # shuffle hexa digits
    hash = ("%c%c%c%c%c%c%c%c"
            % (id[3], id[5], id[7], id[1], id[4], id[2], id[0], id[6]))
    return hash
#enddef


def fixTvTime(time):
    """
    Fixne cas v priblbem formatu 00.00 az 30.00 a mozna i vice.
    Proste hodinu vraci v mod 24.... NAvic premenim XX.YY na XX:YY
    """
    try:
        if time.count('.') == 1:
            time = time.split('.')
            return "%02d:%02d" % (int(time[0]) % 24, int(time[1]))
    except:
        pass
    #endtry
    return time
#enddef

###############################################################################
# Anonym User: ID getter and setter

def getAnonymId(req):
    """
    retrieve anonymId from cookie 
    if failed return 0
    """
    anonymId = 0

    try:
        encryptedId = getASCookie(req)
        if len(encryptedId):
            encryptor = CookieEncrypt()
            id = encryptor.decode(encryptedId)
            anonymId = int(id)
        else:
            dbg.log("ANONYM no id found", DBG = 1)
    except Exception, e:
        # neco neproslo - crc? nech id = 0, uzivatel nerozpoznan
        dbg.log("ANONYM Failed to recognise anonyms cookie: %s", str(e), WARN = 3)

    return anonymId
#enddef

def setAnonymId(req, id):
    """
    Set anonymId to the cookie 
    """
    if not id:
        return

    try:
        encryptor = CookieEncrypt()
        encryptedId = encryptor.encode(str(id))
        setASCookie(req, encryptedId)
    except Exception, e:
        dbg.log("ANONYM failed to set anonym cookie %s", str(e), WARN = 3)
#enddef


###############################################################################
#   Cookie Handlers

def _add_cookie(req, cookie):

    if not req.headers_out.has_key("Set-Cookie"):
        req.headers_out.add("Cache-Control", 'no-cache="set-cookie"')

    # kvuli httponly, ktere neni v pythonu 2.5, mozno odstranit 
    # ifovku pri prechodu na 2.6
    if cookie != None:
        for morsel in cookie.values():
            req.headers_out.add("Set-Cookie", morsel.OutputString())
        #endfor
    #endif
#enddef


def _get_cookies(req):
    try:
        if "cookie" not in req.headers_in:
            return {}
        #endif

        req.config.edbg.logBufSize(102400)

        cookies = req.headers_in["cookie"]
        if isinstance(cookies, (tuple, list)):
            cookies = '; '.join(cookies)
        #endif

        return Cookie.SimpleCookie(cookies)
    except Exception, e:
        req.config.edbg.log('COOKIE ERR: "%s"', repr(e), ERR=3)
        req.config.edbg.log('COOKIE HDR: "%s"', req.headers_in["cookie"], ERR=3)
        raise
    finally:
        req.config.edbg.logBufSize(1024)
    #endtry
#enddef


def getDSCookie(req):
    cookies = _get_cookies(req)
    session = cookies.get("ds", "")
    if (session): session = session.value
    return session
#enddef


def getSessIdCookie(req):
    cookies = _get_cookies(req)
    session = cookies.get("sessId", "")

    if (session):
        session = session.value

    return session
#enddef


def getHintCookie(req):
    cookies = _get_cookies(req)
    hints = cookies.get("hint", "")
    if (hints): hints = hints.value
    #dbg.log("Got hints hints='%s'/(%s)", (hints,decodestring(hints)), DBG=1)
    return hints
#enddef

def getHintWaitCookie(req):
    cookies = _get_cookies(req)
    hw = cookies.get("hw", "")

    if (hw): hw = hw.value

    return hw


def getFilteredCookiesForHint(req, filter):
    cookies = _get_cookies(req)
    filtered = {}
    if (type(filter) != type([])) or not len(filter):
        return {}

    for name in filter:
        cookie = cookies.get(name, "")
        if (cookie):
            filtered[name] = cookie.value
            dbg.log("HINT: Adding %s cookie to list for hint processing" % name, INFO = 1)
    return filtered
#enddef

# get anonym session (encrypted id)
def getASCookie(req):
    cookies = _get_cookies(req)
    id = cookies.get("as", "")
    if id: id = id.value
    return id
#enddef

def getVariationCookie(req, cookieName = "variation"):
    cookies = _get_cookies(req)
    variation = cookies.get(cookieName, "")
    if (variation): variation = variation.value
    return variation
#enddef

def getTipCityCookie(req):
    cookies = _get_cookies(req)
    tipCity = cookies.get("city", "")
    if tipCity:
        tipCity = base64.decodestring(tipCity.value)
    return tipCity
#enddef

def getGeoIpRegion(req):
    try:
        region = int(req.headers_in.get("X-GeoIP-Region", 0))
        if region not in lib_geoip.feedIdRegionMap:
            return 0
        #endif
        return region
    except:
        return 0
    #endtry
#enddef


def getCookie(req, cookie_name, default=""):
    cookies = _get_cookies(req)

    cookie = cookies.get(cookie_name, None)
    if cookie is None:
        return default
    #endif

    return cookie.value
#enddef


def setTipCityCookie(req, city):
    cookie = Cookie.BaseCookie()
    cookie["city"] = base64.encodestring(city).strip()
    city = cookie["city"]
    city["domain"] = req.config.control.cookieDomain
    city["path"] = '/'
    city["expires"] = 24 * 3600
    _add_cookie(req, cookie)
#enddef

def setClientIdCookie(req, clientid):
    cookie = Cookie.BaseCookie()
    cookie["clientid"] = clientid
    clientid = cookie["clientid"]
    clientid["domain"] = req.config.control.cookieDomain
    clientid["path"] = '/'
    clientid["expires"] = 60
    _add_cookie(req, cookie)
#enddef

def setDSCookie(req, session, remember, domain = None):
    dbg.log("Saving session session='%s' remmember=%s",
            (session, remember), DBG = 1)

    # odkomentovat pri prechodu na 2.6
    # cookie = Cookie.BaseCookie()
    # cookie["ds"] = session
    ds = {} #cookie["ds"]

    # ds["httponly"] = True
    ds["domain"] = domain or req.config.control.cookieDomain
    ds["path"] = '/'
    ds["expires"] = None

    if remember:
        if remember < 0:
            # removing cookie
            ds["expires"] = -31536000
        else:
            # session expiruje za jeden rok
            ds["expires"] = +31536000
        #endif
    #endif

    # smazat pri prechodu na 2.6
    req.cookie.set(name = "ds", value = session, domain = ds["domain"],
            path = ds["path"], maxAge = ds["expires"], httponly = True)

    # smazat pri prechodu na 2.6 a odkomentovat radek dole
    _add_cookie(req, None)
    #_add_cookie(req, cookie)
#enddef

def setASCookie(req, hashId, remember = True, domain = None):
    dbg.log("Saving anonym hashid='%s' remember=%s",
            (hashId, remember), DBG = 1)

    cookie = Cookie.BaseCookie()
    cookie["as"] = hashId
    cas = cookie["as"]

    cas["domain"] = domain or req.config.control.cookieDomain
    cas["path"] = '/'

    if remember :
        cas["expires"] = +180 * 24 * 3600 # session expiruje za pul roku
    else:
        cas["expires"] = -180 * 24 * 3600 # odebrani cookie?

    _add_cookie(req, cookie)
#enddef

def setHintCookie(req, hints, remember):
    #dbg.log("Saving hints hints='%s'/(%s)", (hints,decodestring(hints)), DBG=1)

    cookie = Cookie.BaseCookie()
    cookie["hint"] = hints
    hint = cookie["hint"]

    hint["domain"] = req.config.control.cookieDomain
    hint["path"] = '/'

    if remember:
        if remember < 0:
            # removing cookie
            hint["expires"] = -31536000
        else:
            # session expiruje za 100 let(tj. neexpiruje)
            # fixme: check if possible...
            hint["expires"] = +3153600000
        #endif
    #endif

    _add_cookie(req, cookie)
#enddef

def setHintWaitCookie(req, expires = 3600):

    cookie = Cookie.BaseCookie()
    cookie["hw"] = expires
    hint = cookie["hw"]

    hint["domain"] = req.config.control.cookieDomain
    hint["path"] = '/'

    hint["expires"] = expires
    _add_cookie(req, cookie)
#enddef


def setVariationCookie(req, content, cookieName = "variation", cookieMaxAge = +7 * 24 * 3600):
    cookie = Cookie.BaseCookie()
    cookie[cookieName] = content
    variation = cookie[cookieName]

    variation["domain"] = req.config.control.cookieDomain
    variation["path"] = '/'
    variation["expires"] = cookieMaxAge

    _add_cookie(req, cookie)
#enddef


def setNoredirCookie(req):
    dbg.log("Saving mobile=noredir cookie", DBG = 1)

    cookie = Cookie.BaseCookie()
    cookie["mobile"] = "noredir"
    mobile = cookie["mobile"]

    mobile["domain"] = req.config.control.cookieDomain
    mobile["path"] = '/'

    # session expiruje za jeden rok
    mobile["expires"] = +31536000

    _add_cookie(req, cookie)
#enddef


def setBetaCookie(req, cookie_name, expires=+31536000):
    cookie = Cookie.BaseCookie()
    cookie[cookie_name] = "on"
    beta = cookie[cookie_name]

    beta["domain"] = req.config.control.cookieDomain
    beta["path"] = '/'
    beta["expires"] = expires

    _add_cookie(req, cookie)
#enddef


def getFirstLine(s):
    s.replace("\r", "\n")
    pos = s.find("\n")
    if pos != -1:
        return s[:pos]
    else:
        return s
    #endif
#endif


class InetInfo(object):
    """
    InetInfo polymolphic class.
    """

    class InetXInfo(object): # NB: super() only works for new-style classes
        """
        Base class for Inet{4,6}Info
        """

        def __init__(self, req):
            """
            Initialization
            """

            self.remoteIp = self.getLastIp(
                req.headers_in.get(
                    req.config.control.forwardedForHeader,
                    req.connection.remote_ip # loopback
                )
            )
            self.ipForGeoIP = None
            self.ipForSBox = None
        #enddef

        def inet6Aton(self, strIpv6):
            return socket.inet_pton(socket.AF_INET6, strIpv6)
        #enddef
        def inet6Ntoa(self, packedIpv6):
            return socket.inet_ntop(socket.AF_INET6, packedIpv6)
        #enddef
        def inet4Aton(self, strIpv4):
            return socket.inet_aton(strIpv4)
        #enddef
        def inet4Ntoa(self, packedIpv4):
            return socket.inet_ntoa(packedIpv4)
        #enddef
        def getLastIp(self, forwardedForHeader):
            # X-Forwarded-For: client1, proxy1, proxy3
            return forwardedForHeader.replace(",", " ").split(" ")[-1].strip(" ")
        #enddef
    #endclass

    class Inet6Info(InetXInfo):
        """
        Provides extendable IP info in IPv6 nodes.
        """

        def __init__(self, req):
            """
            Initialization
            """

            # initial staff of the parent
            super(InetInfo.Inet6Info, self).__init__(req)

            maxIpLength = 45
            if len(self.remoteIp) > maxIpLength:
                self.remoteIp = self.remoteIp[:maxIpLength]
            #endif

            # we still can use GeoIP for incomming IPv4
            self.ipForGeoIP = self.__tryIPv4Unmap(self.remoteIp)
            self.ipForSBox = self.remoteIp
        #enddef

        def __tryIPv4Unmap(self, strIpv6):
            """
            IPv6 addresses with Embedded IPv4 addresses.
            Format:
                x:x:x:x:x:x:d.d.d.d

            Examples:
                0:0:0:0:0:0:13.1.68.3
                0:0:0:0:0:FFFF:129.144.52.38

                or in compressed form:
                    ::13.1.68.3 
                    ::FFFF:129.144.52.38
            """

            if (strIpv6.count(".") == 3):
                try:
                    return self.inet4Ntoa(self.inet6Aton(strIpv6)[12:])
                except:
                    pass
                #endtry
            #endif
            return None
        #enddef
    #endclass

    class Inet4Info(InetXInfo):
        """
        Provides extendable IP info in IPv4 nodes.
        """

        def __init__(self, req):
            """
            Initialization
            """

            # initial staff of the parent
            super(InetInfo.Inet4Info, self).__init__(req)

            maxIpLength = 15
            if len(self.remoteIp) > maxIpLength:
                self.remoteIp = self.remoteIp[:maxIpLength]
            #endif

            self.ipForGeoIP = self.remoteIp
            self.ipForSBox = self.remoteIp
        #enddef
    #endclass

    def __init__(self, req):
        """
        Initialization
        """

        # choose a delegator
        self.__class__ = {
            "Yes"   : self.Inet6Info,
            "On"    : self.Inet6Info,
            "True"  : self.Inet6Info,
            "No"    : self.Inet4Info,
            "Off"   : self.Inet4Info,
            "False" : self.Inet4Info,
        }.get(
            req.config.control.inet6,
            self.Inet4Info
        )

        # reinitialize into the delegator
        self.__init__(req)

        dbg.log("INET: Using `%s' environment.",
            self.__class__.__name__, DBG = 1)
    #enddef
#enddef


def getLastIp(s):
    maxIpLength = 15
    s = s.replace(",", " ").split(" ")[-1].strip(" ")
    if len(s) > maxIpLength:
        s = s[:maxIpLength]
    #endif
    return s
#enddef


def parseNote(req, inputString):
    """
    Vrati text poznamky vhodny pro vlozeni do HTML.
    """
    if not req.userInfo.userId:
        return ""
    #endif

    tp = ContentCleaner.TextProcessor()

    tp.createReferences(http = "", mailto = "", ftp = "")

    tp.lineBreak('<br />\n')
    tp.linkTarget('_blank')

    try:
        inputString = inputString.decode("utf-8")
    except UnicodeError:
        pass
    #endtry

    try:
        return tp.process(inputString)
    except UnicodeEncodeError:
        pass
    #endtry

    return tp.process(inputString.encode("utf-8"))
#enddef



def logged_jump(req, goto, fs, p):
    """
    Provede presmerovani na url dle pozadavku
    """

    dbg.log("logged_jump called goto=%s", goto, INFO = 3)

    is_https = req.headers_in.get("Referer", "")[:5].lower() == "https"
    baseUrl = req.config.control.baseUrlHTTPS if is_https else req.config.control.baseUrl

    if p:
        return redirHTML(req, "%s/?%s" % (baseUrl,p))
    #endif

    add2Url = ""
    # specialni parametry pro redirect
    if goto == 'addfeed':
        url = fs.getfirst('url', default = '')
        title = fs.getfirst('title', default = '')

        if type(title) == types.UnicodeType:
            title = title.encode('utf-8', 'ignore')
        #endif

        add2Url = 'url=%s&title=%s' % (urllib.quote_plus(url), urllib.quote_plus(title))

    elif goto == 'readfeed':
        feedId = fs.getfirst('feedId', default = '')

        add2Url = 'feedId=%s' % (urllib.quote_plus(feedId))
    #endif

    # jdi na nastaveni Horoskopu
    if goto == 'zodiac':
        return redirHTML(req, '%s/nastaveni-horoskopu' % baseUrl)
    elif goto == 'tv':
        return redirHTML(req, '%s/nastaveni-tv-programu' % baseUrl)
    elif goto == 'weather':
        return redirHTML(req, '%s/nastaveni-pocasi' % baseUrl)
    elif goto == 'feed':
        return redirHTML(req, '%s/nastaveni-zprav' % baseUrl)
    elif goto == 'other':
        return redirHTML(req, '%s/nastaveni-ostatni' % baseUrl)
    elif goto == 'skin':
        return redirHTML(req, '%s/zmena-vzhledu' % baseUrl)
    elif goto == 'export':
        return redirHTML(req, '%s/export-zprav-opml' % baseUrl)
    elif goto == 'addfeed':
        return redirHTML(req, '%s/pridej-zpravy?%s' % (baseUrl, add2Url))
    elif goto == 'readfeed':
        return redirHTML(req, '%s/rss-ctecka-feed?%s' % (baseUrl, add2Url))
    elif goto == 'reader':
        return redirHTML(req, '%s/rss-ctecka' % baseUrl)
    elif goto == 'setup':
        return redirHTML(req, '%s/nove-nastaveni' % baseUrl)
    #endif

    # defaultne jdi na homepage
    return redirHTML(req, "%s/" % baseUrl)
#enddef

def parseCookie(cookie = ""):
    """
    list already seen hints for given cookie(by parsing the cookie)
    """
    status = 200
    created = int(time())
    last_login = 0
    last_hint = 0

    try:
        new_cookie = decodestring(cookie).rstrip(";")
    except:
        dbg.log("HINT cookie parsing error hints = %s", cookie, ERR = 1)
        return {
            'last_hint'    :  last_hint,
            'last_login'    : last_login,
            'created'       : created,
            'status'        : 400,
            'statusMessage' : 'OK',
        }
    #endtry

    dbg.log("HINT parseCookie: new_cookie = %s", new_cookie, DBG = 1)
    seen_hints = new_cookie.split(";")
    aux = seen_hints.pop(0).split(",")
    if len(aux) == 2:
        created, last_login = aux
    #endif
    hints = list()
    for item in seen_hints:
        hint = {}
        hint["hintid"], hint["waveid"], hint["ts"], hint["count"] = item.split(",")
        hints.append(hint)
        last_hint = hint["ts"]
    #endfor

    return {
        'hints'         : hints,
        'last_hint'    : last_hint,
        'last_login'    : last_login,
        'created'       : created,
        'status'        : status,
        'statusMessage' : 'OK',
    }
#enddef

def setDbConfig(req, key, value):
    try:
        req.config.frog.proxy.dbconfig.setAttributes(key, value)
    except:
        dbg.log("Failed to set dbconfig %s with %s", (str(key), str(value)), WARN = 1)
        raise
    #endtry
#enddef

def getDbConfig(req, key):
    #get the value from dbconfig
    res = req.config.frog.proxy.dbconfig.getAttributes(key)
    return res["config"][0]["value"]
#enddef

def getCounter(req, val):
    #get the new value from frog's shared counter
    try:
        res = req.config.frog.proxy.shared.counter.append(val)
        counter = res["shcounter"]
    except:
        counter = 0
    #endtry
    return counter
#enddef

def getVariation(req):
    # try to get variation cookie
    variation = getVariationCookie(req)

    # variation whitelist
    if not variation in ("A", "B", "C"):
        variation = ""
    #endif

    if req.config.control.abTestCookie:
        generateSorryPage = req.form.get.getfirst("generateSorryPage", str, "")
        generatePreprocessedPage = req.form.get.getfirst("generatePreprocessedPage", str, "")
        if not generateSorryPage and not generatePreprocessedPage and not variation:
            # no valid cookie found
            # percentage of requests going to be taken into account
            affected = 20
            v = random.randint(0, 100)
            # take care only about the fraction of requests
            if v < affected:
                # frog query
                limit = getCounter(req, -1)
                if limit > 0:
                    if limit % 2 == 0:
                        variation = "A"
                    else:
                        variation = "B"
                    #endif
                    # issue cookie
                    setVariationCookie(req, variation)
                #endif
            #endif
        #endif
        if not variation in ("A", "B"):
            # give out default variation
            if not variation:
                setVariationCookie(req, "C")
            #endif
            variation = ""
        #endif
    elif not req.config.control.abTest:
        variation = ""
    #endif

    return variation
#enddef

class SharedCounter(object):
    def __init__(self, mcacheClient, mcacheKey):
        self.__mcClient = mcacheClient
        self.__mcKey = mcacheKey
    #enddef

    @property
    def value(self):
        try:
            return int(self.__mcClient.get(self.__mcKey))
        except Exception, err:
            dbg.log("SHARED COUNTER: %s", str(err), ERR = 1)
        #endtry

        return -1
    #enddef

    @property
    def decr(self):
        try:
            return int(self.__mcClient.decr(self.__mcKey))
        except Exception, err:
            dbg.log("SHARED COUNTER: %s", str(err), ERR = 1)
        #endtry

        return -1
    #enddef

    def set(self, value):
        try:
            return self.__mcClient.set(self.__mcKey, str(value))
        except Exception, err:
            dbg.log("SHARED COUNTER: %s", str(err), ERR = 1)
        #endtry

        return -1
    #enddef

    __slots__ = ( "__mcClient", "__mcKey" )
#endclass

class ABTest(object):
    def __init__(self, config):
        if config.control.abTest:
            self.__isEnabled = True
            self.__isCookieSower = config.control.abTestCookie
            if self.__isCookieSower:
                self.__cookieSniffer = self.__cookieSnifferActive
            else:
                self.__cookieSniffer = self.__cookieSnifferPassive
            #endif

            self.__cookieName = config.control.abTestCookieName
            self.__cookieMaxAge = config.control.abTestCookieMaxAge
            pfx = config.control.abTestCookieValuePfx
            self.__variationTuple = tuple("%s%s" % (pfx, v) \
                    for v in config.control.abTestVariations)
            self.__variationCount = len(self.__variationTuple)

            self.__counter = SharedCounter(config.frog.proxy.config.mcache.client,
                    "cookie_%s" % self.__cookieName)
            self.__frog = config.frog

            self.getVariation = self.__getVariation
            self.prepare = self.__prepare
        else:
            self.__isEnabled = False
            self.__isCookieSower = None
            self.__cookieName = None
            self.__cookieMaxAge = None
            self.__variationTuple = None
            self.__variationCount = None
            self.__counter = None
            self.__frog = None
            self.getVariation = lambda req: ""
            self.prepare = lambda: "disabled"
        #endif
    #enddef

    def __prepare(self):
        key = ("abtest_time_start", "abtest_cookies_max_count")
        try:
            cfg = self.__frog.proxy.dbconfig.listAttributes(key)["config"]
            timeStart = datetime.strptime(cfg[key[0]], "%Y-%m-%d %H:%M:%S")
            if timeStart < datetime.now():
                return "already running"
            #endif

            c = int(cfg[key[1]]) + 1
            self.__updateCookieAvailableCount(c)
            self.__counter.set(c)

            if self.__counter.value > 0:
                dbg.log("ABTEST: Prepared", DBG = 1)
                return "ok"
            #endif
        except Exception, err:
            dbg.log("ABTest: Failed to prepare test: %s.",
                    str(repr(err)), ERR = 4)
        #endtry
        return "failed"
    #enddef

    def __getVariation(self, req):
        if (req.form.get.getfirst("generateSorryPage", str, "")
         or req.form.get.getfirst("generatePreprocessedPage", str, "")
         or not getHintWaitCookie(req)
        ):
            return ""
        #enddef

        variation = getVariationCookie(req, self.__cookieName)
        if variation not in self.__variationTuple:
            variation = ""
        #endif

        return self.__cookieSniffer(req, variation)
    #enddef

    def __cookieSnifferPassive(self, req, variation):
        dbg.log("ABTEST: Cookie sniffer is passive", DBG = 1)

        if self.__isCookieSnifferAvailable:
            dbg.log("ABTEST: Enabling cookie sniffer", DBG = 1)
            self.__cookieSniffer = self.__cookieSnifferActive
        #enddef

        dbg.log("ABTEST: User variation: %s", variation, DBG = 1)
        return variation
    #enddef

    def __cookieSnifferActive(self, req, variation):
        dbg.log("ABTEST: Cookie sniffer is active", DBG=1)
        is_started = self.__isStarted

        if not is_started:
            if variation:
                setVariationCookie(req, "", self.__cookieName, 0)
                dbg.log("ABTEST: Cookie deleted.", DBG=1)
            #endif
            variation = ""
        #endif

        if not variation and is_started:
            c = self.__counter.decr
            dbg.log("ABTEST: Current counter value: %s", c, DBG=1)
            if c < 0:
                pass
            elif c > 0:
                variation = self.__variationTuple[c % self.__variationCount]
                setVariationCookie(req, variation,
                                   self.__cookieName, self.__cookieMaxAge)

                if c % 100 == 0:
                    self.__updateCookieAvailableCount(c)
                elif c <= 1:
                    self.__updateCookieAvailableCount(0)
                #endif
            else:
                dbg.log("ABTEST: Disabling cookie sniffer", DBG=1)
                self.__cookieSniffer = self.__cookieSnifferPassive
            #endif
        #endif
        dbg.log("ABTEST: User variation: %s", variation, DBG=1)
        return variation
    #enddef

    def __updateCookieAvailableCount(self, value):
        key = "abtest_cookies_available_count"
        try:
            self.__frog.proxy.dbconfig.setAttributes(key, str(value))
        except Exception, err:
            dbg.log("ABTEST: Failed to update `%s': %s",
                    (key, str(err)), ERR = 1)
        #endtry
    #enddef


    @property
    def __isCookieSnifferAvailable(self):
        return self.__isCookieSower and self.__isEnabled and self.__counter.value > 1
    #enddef

    @property
    def __isStarted(self):
        key = ("abtest_time_start", "abtest_cookies_available_count")
        try:
            cfg = self.__frog.proxy.dbconfig.listAttributes(key)["config"]
            timeStart = datetime.strptime(cfg[key[0]], "%Y-%m-%d %H:%M:%S")
            if timeStart < datetime.now() < timeStart + timedelta(days=14):
                dbg.log("ABTEST: Started", DBG=1)
                return True
            #endif
        except Exception, err:
            dbg.log("ABTEST: Start time converting error: %s.",
                    str(repr(err)), ERR=4)
        #endtry
        dbg.log("ABTEST: Stopped", DBG=1)
        return False
    #enddef


    __slots__ = (
        "__isEnabled",
        "__isCookieSower",

        "__cookieName",
        "__cookieMaxAge",
        "__variationTuple",
        "__variationCount",

        "__counter",
        "__frog",

        "__cookieSniffer",

        "getVariation",
        "prepare"
    )
#endclass

def feed_cmp(list_a, list_b):
    # compare 2 lists
    # list_b contains fully list_a + some additional data

    list_c = []
    for feed in list_b:
        item = {
                "column" : feed["column"],
                "rowCount" : feed["rowCount"],
                "feedId" : feed["feedId"],
                "row" : feed["row"],
        }
        list_c.append(item)
    #endfor

    dbg.log("list_a = %s", str(list_a), DBG = 3)
    dbg.log("list_c = %s", str(list_c), DBG = 3)

    res = cmp(list_a, list_c)
    dbg.log("list comparison result = %s", res, DBG = 3)

    return res
#enddef



def secureUserImageLink(req, objectId):
    """
    Generates secured link used on userweb from the image object id.

    objectId: image object id from repositoryserver

    """

    validity, now = int(req.config.skins.userImageValidity), int(time())
    # divide timestamp with validity and add 1
    # add again 1 if expiration will be less then 10m to go

    exp = (now / validity) + 1 + ((now % validity) > (validity - 600))
    exp *= validity

    # reconstruct image path from the objectId
    timestamp = int(objectId[0:8], 16)
    dt = mx.DateTime.utctime(timestamp)
    ym, dh, cc = dt.strftime("%Y%m"), dt.strftime("%d%H"), objectId[8:10]
    uri = "/secured/%s/%s/%s/%s.jpg" % (ym, dh, cc, objectId)

    final, tr = "t2Hz%s0r2RV%sy1T" % (uri, exp), maketrans("+/", "-_")
    hash = base64.b64encode(md5.new(final).digest()).translate(tr, "=")

    filename = "%s%s%s.jpg" % (objectId, ym, dh)
    # do not add trailing two zeroes (requires validity % 100 == 0)
    return "/userimage/%s/%d/%s" % (hash, exp / 100, filename)
#enddef

#def secureUserImageLink(req, path):
#    """
#    This function requires user image path in form 46/d6/46d658ae01726ab85072f620958e51ae_uvzMup.jpg,
#    and generates secured link used on userweb.
#    """
#
#    validity = int(req.config.skins.userImageValidity)
#    now = int(time())
#    # divide timestamp with validity and add 1
#    # add again 1 if expiration will be less then 10m to go
#    exp = (now / validity) + 1 + ((now % validity) > (validity - 600))
#    exp *= validity
#
#    uri = os.path.join("/secured/%s/%s" % (path[:2],path[2:4]), path)
#    dbg.log("SKIN SEC uri: %s exp: %s", (uri,exp), DBG=1)
#
#    final = "t2Hz%s0r2RV%sy1T" % (uri, exp)
#    tr = maketrans("+/", "-_")
#    hash = base64.b64encode(md5.new(final).digest()).translate(tr, "=")
#    filename = os.path.basename(path)
#    # do not add trailing two zeroes (requires validity % 100 == 0
#    return "/userimage/%s/%d/%s" % (hash, exp / 100, filename)
##enddef

def secureUserImageLinkDecode(securedLink):
    """
    """

    filename = os.path.basename(securedLink)[:-14]
    if re.match(r"(^[a-fA-F\d]{24}$)", filename):
        return filename

    # return os.path.join("/secured/%s/%s" % (filename[:2],filename[2:4]), filename)
    return ""
#enddef

class FeedDataFactory(object):
    """
    Generator dat pro feedy.
    """

    def __init__(self, feedsCached, feedDefinitionList, frog, feedOutageUrl):
        """
        Inicializace.
        """

        self.__feedsCached = feedsCached
        self.__feedDefinitionList = feedDefinitionList
        self.__frog = frog
        self.__feedOutageUrl = feedOutageUrl

        self.__cachedData = feedsCached.getData(int(time()))
        self.__frogData = {}
        self.__iter = None
    #enddef

    def __iter__(self):
        """
        Iterace seznamem feedu dle usporadani (colimn, row).
        """

        self.__iter = iter(sorted(self.__feedDefinitionList,
            key = lambda x: (x["column"], x["row"])))
        return self
    #enddef

    def next(self):
        """
        Vrati data pro aktialni feed. 
        """

        feedDefinition = self.__iter.next()
        feed = self[feedDefinition["feedId"]]
        feed.update({
            "column"      : feedDefinition["column"],
            "row"         : feedDefinition["row"],
            "rowCount"    : feedDefinition["rowCount"],
            "showPreview" : feedDefinition["showPreview"] \
                if "showPreview" in feedDefinition else False
        })
        return feed
    #enddef

    def __getitem__(self, key):
        """
        Pretizeni operatoru [].
        """

        cachedData = self.__cachedData
        if key in cachedData:
            return cachedData[key]
        #endif

        frogData = self.__frogData
        if key in frogData:
            return frogData[key]
        #endif

        fIdSet = set(d["feedId"] for d in self.__feedDefinitionList)
        # seznam idecek, ktere nejsou v cachedData
        feedIds = tuple((fIdSet ^ set(cachedData.iterkeys())) & fIdSet)
        try:
            res = self.__frog.proxy.feed.getContentList(feedIds,
                    self.__feedOutageUrl)
            if res["status"] != 200:
                raise KeyError(key)
            #endif

            fId = lambda x: x["weatherFeedId"] \
                if "weatherFeedId" in x else x["feedId"]

            frogData.update(dict(
                (fId(feed), feed) for feed in res["feeds"])
            )
        except Exception, e:
            msg = "Failed to load data for feed `%s', %s"
            dbg.log(msg, (key, e), ERR = 1)
            raise
        #endtry

        return frogData[key]
    #enddef
#endclass


def prepare_super_feed(req, feed):
    if feed["feedId"] == 1051:
        if feed["url"].find("newFirst=1") != -1:
            # je zapnuto specialni rss s nejnovejsim clankem na zacatku
            dbg.log("AB-SUPER: new rss %s", repr(feed), DBG=1)

            # preskocit nejnovejsi
            feed["items"] = feed["items"][1:]

            '''
            if req.userInfo.variation == "hp_B":
                # pouzit nejnovejsi
                feed["items"] = feed["items"][0:1]
            else:
                # preskocit nejnovejsi
                feed["items"] = feed["items"][1:]
            #endif
            '''
        else:
            dbg.log("AB-SUPER: old rss %s", repr(feed), DBG=1)
        #endif
    #endif
#enddef


def process_only_on_test(func):
    """  
    Use this decorator if you want process a code just on test machine :-)

    The environ variable below is needed in the init script:
    export HOMEPAGE_TEST="yes"
    """
    def wrapper(self, *args, **kwargs):
        if (os.environ.get("HOMEPAGE_TEST", "no") == "yes"):
            return func(self, *args, **kwargs)
        #endif
    #enddef

    return wrapper
#enddef


def get_dbconfig_switch(req, dbconfig_attr, mc_key, ttc=15):
    try:
        force_beta = getCookie(req, "hp_force_beta")
        if force_beta == "1q2w3e4r":
            return 1
        #endif

        mc = req.config.frog.proxy.config.mcache.client

        sw = mc.get(mc_key)
        if sw is not None:
            return int(sw)
        #endif

        cfg = req.config.frog.proxy.dbconfig.listAttributes((dbconfig_attr,))["config"]
        sw = cfg.get(dbconfig_attr, 0)

        mc.set(mc_key, sw, time=ttc)
        return int(sw)
    except Exception, e:
        dbg.log("dbconfig get attribute '%s' error: %s", (dbconfig_attr, str(repr(e))), WARN=4)
    #endtry

    return 0
#enddef


def get_base_url(req):
    scheme = req.headers_in.get("X-Scheme", "http")
    host = req.headers_in.get("X-Host", req.headers_in.get("Host", req.config.control.baseUrl[len("http://"):]))
    return "%s://%s" % (scheme, host)
#enddef

