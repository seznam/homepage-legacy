#!/usr/bin/env python2.5

from base64 import decodestring, encodestring
from Crypto.Cipher import AES
from random import randint

class CiphererError(Exception):
    pass
#endclass

class Cipherer:
    def __init__(self, key, encryptedSize = 64):
        if encryptedSize > 256:
            raise CiphererError("EncryptedSize too big (>256)")
        #endif
        self.encryptedSize = encryptedSize
        key = (key + "#"*32)[:32]
        self.cipherer = AES.new(key, AES.MODE_ECB)
    #enddef

    def encrypt(self, text):
        if len(text) > self.encryptedSize-1:
            raise CiphererError("Text too long (>%s bytes)", self.encryptedSize-1)
        #endif
    
        rubbish = "".join([chr(randint(0, 255)) for _ in xrange(self.encryptedSize)])
        data = (chr(len(text)) + text + rubbish)[:self.encryptedSize]
        return encodestring(self.cipherer.encrypt(data)).replace("\n", "")
    #enddef
    
    
    def decrypt(self, text):
        data = decodestring(text)
        if len(data) != self.encryptedSize:
            raise CiphererError("Invalid encrypted text", self.encryptedSize)
        #endif
    
        data = self.cipherer.decrypt(data)
        l = ord(data[0])+1
        data = data[1:l]
        return data
    #enddef
#endclass


if __name__ == "__main__":
    cipherer = Cipherer("supertajnyklic")

    encrypted = cipherer.encrypt("Lorem ipsum dolor sit amet")
    print encrypted
    print len(encrypted)
    decrypted = cipherer.decrypt(encrypted)
    print decrypted
#endif
