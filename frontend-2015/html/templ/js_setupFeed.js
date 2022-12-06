<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>

<?teng if $.status == 200?>
	{
		status:200,
		method: 'setupFeed',

		userId: '${.userId}',
		
		<?teng frag feedAttributes?>
			<?teng if $typeId !~ 'foreignemail'?>
			<?teng set ._typeId = $typeId ?>
				items : [

					<?teng frag items?>
						<?teng set _perexLen = #NEWS_PEREX_LEN ?>
						<?teng set _isMainArticle = 0 ?>
						<?teng if $_number == 0 ?><!--- 1. clanek, u nekterych feedu je titulni a ma jinak dlouhy perex a ma ho vzdy --->
							<?teng if $._typeId =~ 'novinky' || $._typeId =~ 'super' || $._typeId =~ 'sport' || $._typeId =~ 'prozeny' ?>
								<?teng set _isMainArticle = 1 ?>
								<?teng set _perexLen = @('MAIN_PEREX_LEN_' ++ $._typeId) ?>
								<?teng set _picW = @('MAIN_IMG_W_' ++ $._typeId) ?>
								<?teng set _picH = @('MAIN_IMG_H_' ++ $._typeId) ?>
							<?teng endif ?>
						<?teng endif ?>
						
						{
							description : '<?teng if $.feedAttributes.showPreview || $_isMainArticle?><?teng ctype "quoted-string"?>${wordsubstr($description, 0, $_perexLen, '', '...')}<?teng endctype?><?teng endif?>',
							link : '${link}',
							seznam_image : '${seznam_image}',
							title : '<?teng ctype "quoted-string"?>${title}<?teng endctype?>',
							<?teng if defined(_picW) ?>
								picW: ${_picW},
							<?teng endif ?>
							<?teng if defined(_picH) ?>
								picH: ${_picH},
							<?teng endif ?>						
							isMainArticle : ${_isMainArticle}
						} ${$_count-1 != $_number ? ',': ''}
					<?teng endfrag?>
				]
			<?teng else?> <!--- toto je pro GMAIL, CENTRUM, ATLAS --->
				statusCode : ${statusCode},
				items : [
					<?teng frag items?>
						{
							abstractText : '<?teng ctype "quoted-string"?>${subject}<?teng endctype?>',
							subject : '<?teng ctype "quoted-string"?>${subject}<?teng endctype?>',
							from : '<?teng ctype "jshtml"?>${sender}<?teng endctype?>',
							folderId : '${itemId}',
							<?teng format space="onespace"?>
							timestamp : '
								<?teng set nowH = date("%H",now())?>
								<?teng set nowM = date("%M",now())?>
								<?teng set nowS = date("%S",now())?>
								<?teng set nowT = $nowS+$nowM*60+$nowH*3600?>
								<?teng set firstMidnight = now() - $nowT?>
								<?teng set secondMidnight = $firstMidnight - 86400?>
								<?teng if $sentDate > $firstMidnight ?>
									${date("%H:%M",$sentDate)}
								<?teng elseif $sentDate > $secondMidnight?>
									Včera
								<?teng else?>
									${date("%e.&nbsp;%n.",$sentDate)}
								<?teng endif?>
							',
							<?teng endformat?>
							unread : '0',
							messageId : '${itemId}'
						} ${$_count-1 != $_number ? ',': ''}
					<?teng endfrag?>
				]
			<?teng endif?>

		<?teng endfrag?>
	}
<?teng else?>
	<?teng frag result?>
		{status:${status}, statusMessage : '${statusMessage}'}
	<?teng endfrag?>
<?teng endif?>

<?teng if isenabled("debug")?>
/*-
<?teng debug?>
*/
<?teng endif?>
