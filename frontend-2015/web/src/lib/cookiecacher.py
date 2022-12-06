#/bin/env python2.2
#
# FILE          $Id: 
#
# DESCRIPTION   Caching some user attr to cookies
#

from Crypto.Cipher import AES
import struct
import base64
from cPickle import loads, dumps
import Cookie
from dbglog     import dbg
import zlib

class CookieCacherError(Exception):
    pass

class CookieCacher():
    """ 
    Trida pro cachovani informaci u klienta v cookie

    4kB per cookie = 4096 B per cookie
    char = 4 B
    chars per cookie = 1024
    """

    def __init__(self, config):
        self.secret = config.secret # to decode/encode cookie
        self.expirationTime = config.expirationTime
        self.charsPerCookie = config.charsPerCookie
        self.maxCookies = config.maxCookies
        self.cPrefix = config.cPrefix

        self.codeBlocksize = 16
        self.codePadding = "{"

        self.encoder = AES.new(self.secret)

###################### Getters

    def getUserValues(self, req):
        """
        retrieve all cached attr from cookie
            req         request
        Ret
            dict with attributes
        Raise
            CookieCacherError in cache of any errors
        """
        # get chunks
        self.__loadChunks(req)

        # connect chunks together
        self.__encodedAttrs = "".join(self.__chunks)


        if not self.__encodedAttrs:
            dbg.log("CCACHE empty string to decode", DBG = 1)
            raise CookieCacherError("Chunks do not contain a valid thing")

        self.__decode()

        if not self.__pickledAttrs:
            dbg.log("CCACHE no attr to unpickle", DBG = 1)
            raise CookieCacherError("No attr to unpickle - something must have failed")

        # unpickle
        toSet = loads(self.__pickledAttrs)

        dbg.log("CCACHE attr loaded: %s", str(toSet), DBG = 3)

        return toSet

    def __loadChunks(self, req):
        """
        load cookies to __chunks

        """
        self.__chunks = []

        if not req.headers_in.has_key("cookie"):
            dbg.log("CCACHE ups, no cookies", INFO = 1)
            raise CookieCacherError("Missing cookies.")

        cookies = req.headers_in["cookie"]
        if type(cookies) == type([]):
            cookies = '; '.join(cookies)

        cookies = Cookie.SimpleCookie(cookies)

        for i in range(self.maxCookies):
            name = self.cPrefix + str(i)
            c = cookies.get(name, "")
            if c:
                dbg.log("CCACHE appending cookie: %s", name, DBG = 3)
                self.__chunks.append(c.value)
            else:
                # seems to be no more cookies there, quit
                dbg.log("CCACHE number of cookies loaded: %d", i, DBG = 3)
                break
        #endfor

        if not self.__chunks:
            dbg.log("CCACHE no chunks loaded", DBG = 1)
            raise CookieCacherError("No chunks found.")

    #enddef

    def __decode(self):
        self.__pickledAttrs = ""
        try:
            s = base64.b64decode(self.__encodedAttrs)
            s = self.encoder.decrypt(s).rstrip(self.codePadding)

            text, crc = (s[:-4], s[-4:])

            if not crc == struct.pack("i", zlib.crc32(text)):
                dbg.log("CCACHE crc verification failed", WARN = 2)
                raise CookieCacherError("Failed to validate crc")

            # remove random and save
            self.__pickledAttrs = text[:-4]

        except Exception, e:
            dbg.log("CCACHE decoding failed: %s", str(e), WARN = 2)
            raise CookieCacherError("Failed to decode attrs")

###################### Getters
    def setUserValues(self, req, attrs = {}):
        """
        save values to cokie
        attr
            req         request
            object      object that keeps all altributes to be set
            attrNames   specific attr to be save
        """
        if not attrs:
            dbg.log("CCACHE No attributes specified.", DBG = 3)
            return

        dbg.log("CCACHE attr to save: %s", str(attrs), DBG = 3)

        # retrieve parameters to be save
        self.toSet = attrs

        # covert to string by pickle
        self.__pickledAttrs = dumps(self.toSet)

        # encode
        self.__encode()

        # make chunks
        self.__chunks = [self.__encodedAttrs[i:i + self.charsPerCookie] for i in range(0, len(self.__encodedAttrs), self.charsPerCookie)]

        self.__saveChunks(req)

        dbg.log("CCACHE saved chunks: %d", len(self.__chunks), DBG = 3)


    def __saveChunks(self, req):
        """
        save chunks to cookies
        """

        if not self.__chunks:
            dbg.log("CCACHE no chunks to be saved", DBG = 1)
            return

        numberChunks = len(self.__chunks)

        if numberChunks > self.maxCookies:
            dbg.log("CCACHE max number of cookies exceeded: %d", len(self.__chunks), WARN = 3)
            return

        if not req.headers_out.has_key("Set-Cookie"):
            req.headers_out.add("Cache-Control", 'no-cache="set-cookie"')
        #endif


        for i in range(self.maxCookies):
            cookie = Cookie.BaseCookie()
            name = self.cPrefix + str(i)

            if i < numberChunks:
                cookie[name] = self.__chunks[i]
                c = cookie[name]
                c["expires"] = +self.expirationTime
            else:
                # delete others
                cookie[name] = ""
                c = cookie[name]
                c["expires"] = -self.expirationTime

            c["domain"] = req.config.control.cookieDomain
            c["path"] = '/'

            for value in cookie.values():
                req.headers_out.add("Set-Cookie", value.OutputString())
            #endfor
        #endfor

    def __encode(self):
        s = []

        s.append(self.__pickledAttrs)
        # add random 4 chars
        #s.append(struct.pack("i", random.getrandbits(24)))
        # salt to the same value:
        s.append(struct.pack("i", 1234))
        # add crc 4 chars
        s.append(struct.pack("i", zlib.crc32("".join(s))))

        s = "".join(s)

        # add padding
        s = s + (self.codeBlocksize - len(s) % self.codeBlocksize) * self.codePadding

        self.__encodedAttrs = base64.b64encode(self.encoder.encrypt(s))

    def removeUserValues(self, req):
        dbg.log("CCACHE removing all user cache cookies", DBG = 1)

        if not req.headers_in.has_key("cookie"):
            dbg.log("CCACHE ups, no cookies", DBG = 2)
            return

        cookies = req.headers_in["cookie"]
        if type(cookies) == type([]):
            cookies = '; '.join(cookies)

        cookies = Cookie.SimpleCookie(cookies)

        for i in range(self.maxCookies):
            cookie = Cookie.BaseCookie()
            name = self.cPrefix + str(i)

            if not cookies.get(name, ""):
                continue

            cookie[name] = ""
            c = cookie[name]
            c["expires"] = -self.expirationTime
            c["domain"] = req.config.control.cookieDomain
            c["path"] = '/'

            for value in cookie.values():
                req.headers_out.add("Set-Cookie", value.OutputString())
            #endfor

