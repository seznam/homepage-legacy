#!/usr/bin/env python2.5
#
# FILE          $Id$
#
# DESCRIPTION   HomePage (RSS/XML/...) reader
#

from dbglog import dbg
import socket
import select
import errno
import re
import mx.DateTime
import error

class NotModified:

    def __init__(self):
        pass
    #enddef
#endclass

class NotSupported:

    def __init__(self):
        pass
    #enddef
#endclass

class ServerError:

    def __init__(self, code):
        self.code = code
    #enddef
#endclass

class UnsupportedScheme:

    def __init__(self):
        pass
    #enddef
#endclass

class Mooved:

    def __init__(self, location):
        self.location = location
    #enddef
#endclass

class UnexpectedConnectionClose:

    def __init__(self):
        pass
    #enddef
#endclass

class HttpProxy:
    # Sceleton from http://www.koders.com/python/fidE92922298001E0A833811CDB777165F84284696E.aspx

    def __init__(self, host, port, config, internal):
        self.host = host
        self.port = int(port)
        self.proxyHost = config.http.proxyHost
        self.proxyPort = config.http.proxyPort
        self.writeTimeout = config.http.writeTimeout / 1000
        self.readTimeout = config.http.readTimeout / 1000
        self.connectTimeout = config.http.connectTimeout / 1000
        if internal:
            self.maxResponseSize = config.http.internalMaxResponseSize
        else:
            self.maxResponseSize = config.http.maxResponseSize
        #endif

        self.maxResponseTime = config.http.maxResponseTime
        self.socket = None
    #enddef

    def timeoutConnect(self, host, port):
        if not port or not host or not self.socket:
            return

        self.socket.setblocking(0)
        try:
            self.socket.connect((host, port))
        except socket.error, val:
            if val[0] == errno.EINPROGRESS:
                # All is OK
                pass
            else:
                raise socket.error(val)
            #endif
        #endtry

        # wait for the connect to succeed, or time out in 10s
        fds = select.select([], [self.socket], [], self.connectTimeout)

        if fds[1].count(self.socket) > 0 :
            # Check the socket for an error
            # we got the connection...if there was no error
            i = self.socket.getsockopt(socket.SOL_SOCKET, socket.SO_ERROR)
            if 0 == i:
                self.socket.setblocking(1)
                return
            else:
                raise error.MessageError("Socket error(%s)." % i)
            #endif
        #endif
        self.socket = None
        raise error.MessageError("Cannot connect to <%s:%d>." % (host, port))
    #enddef

    def connect(self):
        # Vytvorime socket a nastavime neblokujici rezim
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

        #
        # Pokud se ma jet pres proxy, je nutno se na ni pripojit
        #
        if self.proxyHost and self.proxyPort:
            dbg.log("Connecting to server <%s:%d> via proxy <%s:%d>.", (self.host,
                self.port, self.proxyHost, self.proxyPort), INFO = 2)
            self.timeoutConnect(self.proxyHost, self.proxyPort)
        else:
            #
            # Prima komunikace
            #
            dbg.log("Connecting directly to server <%s:%d>.", (self.host, self.port), INFO = 2)
            self.timeoutConnect(self.host, self.port)
        #endif

        dbg.log("Connected to <%s:%d>.", (self.host, self.port), INFO = 1)
    #enddef

    def get(self, url, since, etag):
        response = ""
        if self.socket:
            if self.port == 80:
                get = "GET http://%s%s HTTP/1.1\n" % (self.host, url)
            else:
                get = "GET http://%s:%d%s HTTP/1.1\n" % (self.host, self.port, url)
            #endif
            get += "User-Agent: HomePage Rss Reader 1.0;\n" #Seznam.cz a.s.\n"
            get += "Host: %s\n" % (self.host)
            get += "Cache-Control: no-cache\n"
            get += "Accept-Charset: utf-8\n"
            get += "Accept: application/atom+xml,application/rdf+xml,application/rss+xml," + \
                   "application/x-netcdf,application/xml;q=0.9,text/xml;q=0.2,*/*;q=0.1\n"
            get += "Connection: close\n"
            if etag:
                get += "If-None-Match: %s\n" % (etag)
            else:
                if since:
                    get += "If-Modified-Since: %s\n" % (_getModified(since)) #Sat, 29 Oct 1994 19:43:31 GMT
                #endif
            #endif
            get += "\n"
            dbg.log("Send get: `%s'", (get), INFO = 1)

            fds = select.select([], [self.socket], [], self.writeTimeout)
            if len(fds[1]) == 0:
                raise error.MessageError("WriteTimeout to proxy expired.")
            #endif
            self.socket.send(get)

            # Cteme data
            timeLimit = mx.DateTime.now() + self.maxResponseTime * mx.DateTime.oneSecond
            responseSize = 0
            bufferSize = 4096
            try:
                while True:
                    fds = select.select([self.socket], [], [], self.readTimeout)
                    if len(fds[0]) == 0:
                        raise error.MessageError("ReadTimeout expired.")
                    #endif
                    buffer = self.socket.recv(bufferSize)
                    if len(buffer) == 0:
                        break;
                    #endif
                    dbg.log("Got %s bytes from server <%s:%d>.",
                            (len(buffer), self.host, self.port), INFO = 1)


                    if mx.DateTime.now() > timeLimit:
                        raise error.MessageError("MaxResponseTime expired.")
                    #endif

                    responseSize += len(buffer)
                    if responseSize > self.maxResponseSize:
                        raise error.ResponseIsTooBig("Response too big(> %d)" % (self.maxResponseSize))
                    #endif

                    response += buffer
            except error.MessageError:
                raise
            except Exception, e:
                dbg.log("Unexpected connection close: (%s)", str(repr(e)), ERR = 3)
                self.socket = None
                raise UnexpectedConnectionClose
            #endtry

            dbg.log("Server return `%d' bytes.", (responseSize), INFO = 1)
        else:
            raise error.MessageError("Not connected")
        #endif

        return self.checkResponse(response)
    #enddef

    def close(self):
        if self.socket:
            self.socket.close()
            self.socket = None
            dbg.log("Connection close.", INFO = 1)
        #endif
    #endef    

    def checkResponse(self, response):
        #
        # Otestuje vraceny kod
        #      
        lines = response.splitlines()
        headers = {}

        code = -1
        codeline = ""
        recode = re.compile("^HTTP/\d+.\d+ (\d+) .*$")
        reheader = re.compile("([^:]+): (.*)")
        for line in lines:
            if line == "":
                break
            #endif
            match = recode.match(line)
            if match:
                code = int(match.group(1))
                codeline = line
            else:
                match = reheader.match(line)
                dbg.log("Try match header: %s", (line), INFO = 1)
                if match:
                    headers[match.group(1)] = match.group(2)
                    dbg.log("Save header: %s: %s", (match.group(1), match.group(2)), INFO = 1)
                #endif
            #endif
        #endif
        if code == -1:
            raise error.MessageError("Bad HTTP response.")
        #endif

        #
        # 200 - Prijimame data
        #
        charset = ""
        if code / 100 == 2:
            dbg.log("SERVER RETURN: %s", codeline, INFO = 1)
            data = ""

            # Poznamename etag
            etag = None
            if headers.has_key("Etag"):
                etag = headers["Etag"]
            #endif
            # Poznamename charset
            if headers.has_key("Content-Type"):
                try:
                    charset = re.search("charset=['\"]?([^\s,'\"]*)['\"]?",
                            headers["Content-Type"]).group(1)
                except:
                    charset = ""
                #endtry
            #endif

            # nacitame data
            write = False
            for line in lines:
                if not line:
                    write = True
                    continue
                #endif
                if write:
                    data += line
                #endif
            #endfor

            return {"data": data, "etag": etag, "charset": charset}
        #endif

        #
        # 304 - Nic se nezmenilo
        #
        if code == 304:
            dbg.log("SERVER RETURN: %s", codeline, INFO = 1)
            raise NotModified
        #endif

        #
        # 301, 302, 303, 305, 307 - redirecty
        #
        if code in (301, 302, 303, 305, 307):
            if not headers.has_key("Location"):
                raise NotSupported
            #endif

            dbg.log("Follow redirect to `%s'", (headers["Location"]), INFO = 2)
            raise Mooved(headers["Location"])
        #endif

        if code / 100 == 3:
            dbg.log("SERVER RETURN: %s", codeline, WARN = 3)
            raise NotSupported
        #endif

        #
        # Chyby
        #
        if code / 100 == 4 or code / 100 == 5:
            dbg.log("SERVER RETURN: %s", codeline, WARN = 3)
            raise ServerError(code)
        #endif

        raise error.MessageError("Unknown HTTP return code `%d' in `%s'" % (code, codeline))
    #enddef
#endclass

def get(url, since, etag, internal, config):
    scheme = "http"
    host = ""
    port = 80
    path = ""
    response = {"data": "", "etag": "", "charset": ""}

    # naprasujeme url
    (scheme, host, port, path) = parseUrl(url)

    if scheme.lower() == "http":
        #
        # HTTP
        #

        location = path
        counter = 0
        # Podporujeme redirect
        while location:
            try:
                proxy = HttpProxy(host, port, config, internal)
                try:

                    proxy.connect()

                    response = proxy.get(path, since, etag)

                    location = ""

                finally:
                    proxy.close()

            except Mooved, exp:
                location = exp.location
                (xscheme, host, port, path) = parseUrl(location, host, port, path)

                if xscheme.lower() != "http":
                    dbg.log("Cannot redirect to scheme `%s' try redirect to http.",
                            (xscheme.lower()), WARN = 3)
                    xscheme = "http"
                #endif
            #endif

            if location:
                dbg.log("New redirect to %s. Tries `%d'.", (location, counter), INFO = 3)
            #endif

            counter += 1
            if counter > 10:
                raise NotSupported
            #endif
        #endwhile

    elif scheme.lower() == "https":
        #
        # HTTPS
        #
        import urllib2

        if config.http.proxyHost and config.http.proxyPort:
            proxy_addr = "%s:%s" % (config.http.proxyHost, config.http.proxyPort)
            proxy = urllib2.ProxyHandler({"https": proxy_addr, "http": proxy_addr})
            opener = urllib2.build_opener(proxy)
        else:
            opener = urllib2.build_opener()
        #endif

        urllib2.install_opener(opener)
        request = urllib2.Request(url)

        request.add_header("User-Agent", "HomePage Rss Reader 1.0")
        if etag:
            request.add_header("If-None-Match", etag)
        elif since:
            request.add_header("If-Modified-Since", _getModified(since))
        #endif

        try:
            res = opener.open(request, timeout=1)
        except urllib2.URLError, e:
            dbg.log("URL error: %s", str(repr(e)), ERR=4)
            raise
        except socket.timeout, e:
            dbg.log("MaxResponseTime expired. (%s)", str(repr(e)), ERR=4)
            raise error.MessageError("MaxResponseTime expired. (%s)" % str(repr(e)))
        #endtry

        try:
            charset = res.headers.get("Content-Type").split("charset=")[1]
        except (IndexError, AttributeError):
            charset = None
        #endtry

        response = {"data": res.read(), "etag": res.headers.get("ETag"), "charset": charset}

    elif scheme.lower() == "file":
        #
        # FILE
        #
        f = open(path, "r")

        while True:
            buffer = f.read(4096)

            if len(buffer) == 0:
                break
            #endif

            response += buffer
        #endwhile

        f.close()

        response = {"data": response, "etag": None, "charset": ""}

    else:
        dbg.log("Unsupported scheme `%s'", (scheme), WARN = 2)
        raise UnsupportedScheme
    #endif

    return response
#enddef

def _getModified(date):
    # Sat, 29 Oct 1994 19:43:31 GMT
    # format into an RFC 1123-compliant timestamp. We can't use
    # time.strftime() since the %a and %b directives can be affected
    # by the current locale, but RFC 2616 states that dates must be
    # in English.
    modified = date.gmtime().tuple()
    weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return "%s, %02d %s %04d %02d:%02d:%02d GMT" % (weekdays[modified[6]], modified[2],
            months[modified[1] - 1], modified[0], modified[3], modified[4], modified[5])
#enddef

def parseUrl(url, old_host = None, old_port = None, old_path = None):
    port = 80
    host = ""
    path = ""
    scheme = ""

    # Jestlize to neni absolutni cesta i se serverem a server zname tak 
    if url and url.find("://") < 0 and old_host and old_port and old_path:
        # Jedna se o absolutni na sarveru
        if url[0:1] == '/':
            return ("http", old_host, old_port, url)
        #endif
        # Jedna se relativni v adresari?
        if old_path[len(old_path) - 1: len(old_path)] != "/":
            return ("http", old_host, old_port, old_path + "/" + url)
        #endif
        return ("http", old_host, old_port, old_path + url)
    #endif

    try:
        i = 0
        try:
            # schema
            i = url.index("://")   # Pokud nenajde vyhodi vyjimku
            scheme = url[0:i]
            url = url[i + 3:]
        except:
            if len(url) > 3:
                begin = url[0:3].lower()
                if begin == "www" or begin == "rss":
                    scheme = "http"        # Predpokladame http, pokud neni uvedeno
                else:
                    raise
                #endif
            else:
                raise
            #endif
        #endtry

        try:
            # jmeno a heslo
            i = url.index('@')
            url = url[i + 1:]  # Zatim ho nepotrebujeme
        except:
            pass
        #endtry

        # host
        i = url.find('/')
        if i == -1:
            i = url.find('?')
            if i == -1:
                i = len(url)
            #endif
        #endif
        host = url[:i]
        path = url[i:]

        # mame v hostu port?
        i = host.find(':')
        if i != -1:
            port = int(host[i + 1:])
            host = host[:i]
        #endif
    except:
        raise error.MessageError("Bad url format.")
    #endtry     

    if len(path):
        if path[0:1] != "/":
            path = "/%s" % path
        #endif
    else:
        path = "/"
    #endif

    dbg.log("Parsed url %s", (str((scheme, host, port, path))), INFO = 1)
    return (scheme, host, port, path)
#enddef
