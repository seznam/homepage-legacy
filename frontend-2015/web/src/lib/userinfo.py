#/bin/env python2.2
# $Id$
"""
DESCRIPTION   User info
"""

from dbglog     import dbg
from anonyminfo import AnonymInfo
from loggedinfo import LoggedInfo
import urllib

class UserInfo:
    """
    Trida zpristupnujici data uzivatele
    """

    def __init__(self, req, loginRedirect = None, checkHashId = True, loginRequired = False):
        """
        Inicializuje objekt uzivatele.
        """

        if (hasattr(req, "userInfo")
          and req.userInfo
          and isinstance(req.userInfo, (AnonymInfo, LoggedInfo))
        ):
            # Vytvoreno publiserem
            return
        #endif

        try:
            # prihlaseny uzivatel
            req.userInfo = LoggedInfo(req, checkHashId)
        except Exception, e:
            dbg.log("USER LOGGED failed %s", str(e), DBG = 1)
            #presmerovani pro neprihlaseneho uzivatele
            if loginRequired:
                lib_util.redirHeaders(req, '/prihlaseni?continue=%s' % urllib.quote_plus(req.unparsed_uri))

            if loginRedirect != None:
                # presmeruj na login stranku
                if loginRedirect:
                    lib_util.redirHeaders(req, '/prihlaseni?goto=%s' % loginRedirect)
                else:
                    lib_util.redirHeaders(req, '/prihlaseni')

            # neprihlaseny uzivatel
            req.userInfo = AnonymInfo(req, checkHashId)
        #endtry

    #enddef
#endclass
