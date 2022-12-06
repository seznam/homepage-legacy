from dbglog import dbg
import pickle


class GoogleRating:
    def __init__(self, req):
        self.app_id = "cz.seznam.sbrowser"

        self.req = req
        self.mc = self.req.config.frog.proxy.config.mcache.client
        self.mc_key = "GOOGLE_APP_RATING"
        self.mc_key_sw = "SW_GOOGLE_APP_RATING"
        self.feed_id = 94894
    #enddef

    def get(self):
        try:
            sw = self.mc.get(self.mc_key_sw)
            if sw is None:
                cfg = self.req.config.frog.proxy.dbconfig.listAttributes(("app_promo_switch",))["config"]
                sw = cfg.get("app_promo_switch", 0)
                self.mc.set(self.mc_key_sw, sw, time=60)
            #endif
            if not int(sw):
                return []
            #endif

            rating = self.mc.get(self.mc_key)

            if rating is None:
                rating = self.__get_rating()
                self.mc.set(self.mc_key, pickle.dumps(rating), time=60)
            else:
                rating = pickle.loads(rating)
            #endif
        except Exception, e:
            dbg.log("Sbrowser App Rating Error: %s", str(repr(e)), WARN=3)
            rating = []
        #endtry

        return rating
    #enddef

    def __get_rating(self):
        res = self.req.config.frog.proxy.feed.getContent(self.feed_id)
        try:
            dbg.log("Sbrowser: %s", str(repr(res["items"])), INFO=3)
            return res["items"]
        except Exception, e:
            dbg.log("Sbrowser App Rating Error: %s", str(repr(e)), WARN=3)
            return []
        #endfor
    #enddef
#endclass

