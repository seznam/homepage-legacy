#!/usr/bin/env python2.5
#
# $Id$
"""
DESCRIPTION   Encrypt user id obtained from cookie
"""

import zlib
from Crypto.Cipher import AES
import random
import struct
import base64

class CookieValueError(Exception):
    pass

class CookieEncrypt:
    padding = "{"
    blocksize = 16

    @staticmethod
    def __addPadding(s):
        return s + (CookieEncrypt.blocksize - len(s) % CookieEncrypt.blocksize) * CookieEncrypt.padding

    # secret has to be % blocksize == 0
    def __init__(self, secret):
        self.encoder = AES.new(secret)

    @staticmethod
    def __addRandom(s):
        return s + struct.pack("i", random.getrandbits(32))

    @staticmethod
    def __getId(s):
        return s[:-8]

    @staticmethod
    def __addCheckSum(s):
        return s + struct.pack("i", zlib.crc32(s))

    @staticmethod
    def __verifyCheckSum(s):
        text, crc = (s[:-4], s[-4:])

        if not crc == struct.pack("i", zlib.crc32(text)):
            raise CookieValueError("checksum mismatch")

    def encode(self, id):
        text = CookieEncrypt.__addRandom(id)
        text = CookieEncrypt.__addCheckSum(text)
        text = CookieEncrypt.__addPadding(text)
        return base64.b64encode(self.encoder.encrypt(text))

    def decode(self, cookieHash):
        text = base64.b64decode(cookieHash)
        text = self.encoder.decrypt(text).rstrip(CookieEncrypt.padding) # remove padding decode
        CookieEncrypt.__verifyCheckSum(text)
        return CookieEncrypt.__getId(text)
