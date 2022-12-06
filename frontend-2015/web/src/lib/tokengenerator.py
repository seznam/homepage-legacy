#!/usr/bin/env python2.5
#
# FILE          $Id$
#
# DESCRIPTION   Token Generator and verificator
#

from Crypto.Cipher import AES
import random
from time import time
from base64 import urlsafe_b64decode, urlsafe_b64encode
from dbglog     import dbg

class TokenGenerator:

    def __init__(self, config):
        self.encoder = AES.new(config.secret)
        self.timeout = config.expirationTime
        self.padding = "{"
        self.blocksize = 16

    def generate(self, keyNumber):
        now = round(time())
        rand = random.randint(100000, 999999)

        if keyNumber:
            nakedToken = "%i%i%i" % (rand, now, keyNumber)

        else:
            nakedToken = "%i%i%i" % (rand, now, random.randint(1000, 999999))

        if len(nakedToken) % self.blocksize:
            token = "".join([nakedToken, (self.blocksize - len(nakedToken) % self.blocksize) * self.padding])

        token = urlsafe_b64encode(self.encoder.encrypt(token))

        dbg.log("SEC HASHID generated token: %s", token, DBG = 1)

        return token

    def validate(self, token, keyNumber):
        if not token:
            return False

        try:
            number = self.encoder.decrypt(urlsafe_b64decode(token.encode("utf-8"))).rstrip("{")[6:]

            validFrom = int(number[:10])

            if keyNumber and keyNumber != int(number[10:]):
                return False
        except Exception, e:
            dbg.log("SEC HASHID validation failed: %s", str(e), WARN = 2)
            return False

        now = round(time())

        dbg.log("SEC HASHID now: %i validFrom: %i", (now, validFrom) , INFO = 1)

        return (now + 200) >= validFrom >= (now - self.timeout)

