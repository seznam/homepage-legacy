#!/usr/bin/perl

my $sorryPage = `cfggetvalue /www/homepage/userweb/conf/homepage.conf control SorryPage`;

if ($sorryPage == 1) {
    print "\$HTTP[\"url\"] =~ \"^/\$\" {\n";
    print "    server.document-root = \"/www/homepage/userweb/template\"\n";
    print "    index-file.names = (\"index_sorry.html\")\n";
    print "    proxy.server = ()\n";
    print "}\n";
}
