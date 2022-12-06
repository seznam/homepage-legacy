if(typeof Homepage != "object") {
	Homepage = {};
};

if(typeof Homepage.CONF != "object") {
	Homepage.CONF = {};
};

Homepage.CONF = {
	SERVICE_URL : '#{SERVICE_URL}',
	PATH_IMG	: '#{PATH_IMG}',
	FRIENDS_URL : '/misc.fcgi?akce=hp_seznam_js&hash=',

	/*- nastaveni pro hledani*/
	SEARCH_INTERNET_ID : 1,
	SEARCH_TAB_COUNT : #{SEARCH_TAB_COUNT}-1,
	SEARCH_RSS_LIMIT : 1000,
	ENABLE_SETTINS_RELOAD : #{ENABLE_SETTINS_RELOAD},
	SERVER_EMAIL : "#{SERVER_EMAIL}",


	mail_url_191 : "#{mail_url_191}",
	mail_url_190 : "#{mail_url_190}",
	mail_url_192 : "#{mail_url_192}"
};
