# Zdrojové kódy frontendu hlavní stránky Seznam.cz z roku 2015

Tento adresář obsahuje zdrojový kód frontendu z roku 2015, ale části pocházejí
ze starší doby, některé soubory byly vytvořeny už v roku 2006.

Kód je rozdělen do následujících hlavních částí:

- serverový kód v [podadresáři web](web/)
- klientský kód v [podadresáři html](html/)

## Serverový kód

Serverová část logiky frontendu je implementována v Pythonu, která je spouštěná
[Apache HTTP serverem](https://httpd.apache.org/) pomocí
[mod_python](https://modpython.org/).

Zdrojové kódy jsou umíštěny v [web/src](web/src/), s pomocnými knihovnami v
podadresáři [web/src/lib](web/src/lib/), s nastavením v [web/conf](web/conf/).
Několik pomocných statických obrázků je v [web/www/img](web/www/img/).

Součástní komponeny jsou pomocné scripty, které jsou umístěny v
[web/bin](web/bin/).

Serverová část generuje HTML (případně JS) pro klienta pomocí knihovny
[Teng](https://github.com/seznam/teng) a šablon v klientské části kódu v
adresáři [html/templ](html/templ/).

## Klientský kód

Klientský kód využívá HTML a JS šablony umístěné v adresáři
[html/templ](html/templ/), kterých části jsou vyplněné daty pomocí knihovny
[Teng](https://github.com/seznam/teng) na serveru.

CSS styly jsou psané v čistém CSS a jsou v adresáři [html/css](html/css/).

Klientská aplikační logika je psaná v čistém JavaScriptu (ECMAScript 3),
nachází se v adresáři [html/js](html/js/) a cílí na podporu
[IE 8](https://en.wikipedia.org/wiki/Internet_Explorer), případně i starších
prohlížečů. Kód využívá knihovnu [Seznam JAK](https://github.com/seznam/JAK) (v
minulosti pojmenované SZN), a komunikuje se serverem pomocí
[AJAXu](https://en.wikipedia.org/wiki/Ajax_(programming)) a
[JSONP](https://en.wikipedia.org/wiki/JSONP), přičemž pro kódování obsahu se
využívá [JSON](https://en.wikipedia.org/wiki/JSON),
[XML](https://en.wikipedia.org/wiki/XML) a
[FastRPC](https://github.com/seznam/node-fastrpc).

Kód zahrňuje knihovnu [JW Player](https://en.wikipedia.org/wiki/JW_Player) pro
přehrávání videa. Verze knihovny je z doby, kdy byl přehrávač ještě
distribuován jako open source.

Statické obrázky používané službou jsou v adresáři [html/img](html/img/).

Součástí komponenty jsou také některé veřejné firemní microsites, které se
nacházejí v adresáři [html/microsite](html/microsite/).
