<?teng format space="nowhitelines"?>
<!--- nejprve zjistime typ feedu 1. je obycejne rss --->
<?teng set my_varComma = ''?> <!--- carkovani za objekty v poli --->
<?teng if $typeId =~ 'rss' || $typeId =~ 'novinky' || $typeId =~ 'super' || $typeId =~ 'sport' || $typeId =~ 'prozeny' ?>
	<?teng set my_varComma = ','?>
	<?teng set ._typeId = $typeId ?>
	{
		typeId : '${typeId}',
		feedId : ${feedId},
		userId : '${.userId}',
		items : [
			<?teng frag items?>
				<?teng if $rowCount >= $_number+1 ?>
					
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
						description : '<?teng if $showPreview || $_isMainArticle?><?teng ctype "quoted-string"?>${wordsubstr($description, 0, $_perexLen, '', '...')}<?teng endctype?><?teng endif?>',
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
					} ${$rowCount != $_number+1? ',' : ''}
					
				<?teng endif?>
			<?teng endfrag?>
		]
	}
<?teng elseif $typeId =~ 'foreignemail'?>
	<?teng if $.userId > 0?>
		<?teng set my_varComma = ','?>
		{
			typeId : '${typeId}',
			feedId : ${feedId},
			statusCode : ${statusCode},
			username : '${$username}',
			items : [
				<?teng if $username !~ ''?>
					<?teng frag items?>
						<?teng set my_varCommaItem = ''?>
						<?teng if $rowCount >= $_number+1 ?>
							<?teng set my_varCommaItem = ','?>
							${$_number == 0 ? '' : $my_varCommaItem} // carkovani za polozkami v poli
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
										${date("%e.%n.",$sentDate)}
									<?teng endif?>
								',
								<?teng endformat?>
								unread : '0',
								messageId : '${itemId}'
							}
						<?teng endif?>
					<?teng endfrag?>
				<?teng endif?>
			]
		}
	<?teng endif?>
<?teng elseif $typeId =~ 'email'?>
	<?teng if $.userId > 0?>
		<?teng set my_varComma = ','?>
		{
			typeId : '${typeId}',
			feedId : ${feedId},
			<?teng frag emailWindow?>
				newMessages : '${newMessages}',
			<?teng endfrag?>

			items : [
				<?teng frag emailWindow?>
					<?teng frag message?>
						{
							<?teng set subjectEscaped = ($subject)?>
							<?teng set abstractEscaped = ($abstract)?>
							abstractText : '<?teng ctype "quoted-string"?>${abstractEscaped}<?teng endctype?>',
							subject : '<?teng ctype "quoted-string"?>${subjectEscaped}<?teng endctype?>',
							from : '<?teng ctype "quoted-string"?>${from}<?teng endctype?>',
							folderId : '${folderId}',
							<?teng format space="onespace"?>
							timestamp : '
								<?teng set nowH = date("%H",now())?>
								<?teng set nowM = date("%M",now())?>
								<?teng set nowS = date("%S",now())?>
								<?teng set nowT = $nowS+$nowM*60+$nowH*3600?>
								<?teng set firstMidnight = now() - $nowT?>
								<?teng set secondMidnight = $firstMidnight - 86400?>
								<?teng if $timestamp > $firstMidnight ?>
									${date("%H:%M",$timestamp)}
								<?teng elseif $timestamp > $secondMidnight?>
									Včera
								<?teng else?>
									${date("%e.%n.",$timestamp)}
								<?teng endif?>
							',
							<?teng endformat?>
							unread : '${unread}',
							messageId : '${messageId}'
						} ${$_count-1 != $_number ? ',': ''}
					<?teng endfrag?>
				<?teng endfrag?>
			]
		}
	<?teng endif?>
<?teng elseif $typeId =~ 'television'?>
	<?teng set my_varComma = ','?>
	{
		typeId : '${typeId}',
		<?teng frag feed_tv?>
			type : '${type}',
		<?teng endfrag?>
		feedId : ${feedId},
		items : [
			<?teng frag feed_tv?>
			<?teng if $type =~ 'tips'?>
				<?teng frag tip_item?>
						{
							channel_name: '${channel_name}',
							id:'${_number}',
							idPrg: '${id}',
							title: '<?teng ctype "quoted-string"?>${title}<?teng endctype?>',
							time_start:'${date("%H:%M", $time_start)}',
							description:'<?teng ctype "quoted-string"?>${description}<?teng endctype?>',
							picture_url: '${picture_url}'
						}${$_number != $_count-1?',':''}
				<?teng endfrag?>
			<?teng else?>
				<?teng frag item?>
						{
							channelId: ${channelId},
							id:${_number},
							idPrg: ${id},
							type:'${type}',
							title : '<?teng ctype "quoted-string"?>${title}<?teng endctype?>',
							channel:'${channel}',
							time:'${date("%H:%M", $time)}',
							timeTo:'${date("%H:%M", $timeTo)}',
							progress:${progress}
						}${$_number != $_count-1?',':''}
				<?teng endfrag?>
			<?teng endif?>
			<?teng endfrag?>
		]
	}
<?teng endif?>
${my_varComma}
<?teng endformat?>
