<?teng format space="onespace"?>
	var answer = {
		<?teng if $.feed_rss._count > 0?>
			rss :[
			<?teng frag feed_rss?>
				{ 
					updateOnly	: ${.updateOnly},
					userId		: ${.userId},
					allowImage	: ${allowImage},
					allowHtml 	: ${allowHtml},
					feedId		: '${feedId}',
					title		: '${title}',
					serverUrl	: '${serverUrl}',
					lastUpdate 	: '${date('%H:%M',$lastUpdate)}',
					maxItems	: ${maxItems},
				    advertCode	: '<?teng if exist(advertGroup) && dictexist('advert_'++$groupId)?><?dyntag advert zoneId="${@('advert_'++$groupId)}" charset="utf-8" escape="js"?><?teng endif?>',
					item : [
					<?teng frag items?>
						<?teng if $feed_rss.maxItems > $_number?>
							{id:${_number}, title:'${$.feed_rss.allowHtml==1?unescape($title):$title}', link:'${link}', seznam_image : '${seznam_image}'}${($_count-1 != $_number) && ($feed_rss.maxItems > $_number+1) ? ',' :''}
						<?teng endif?>
					<?teng endfrag ?>
				 	] 
				}${$_number != $_count-1 ? ',' :''}
			<?teng endfrag ?>
			]
		<?teng else?>
			status 	: '${status}',
			feedId	: '${feedId}',
			diff	: '${exist(diff)?$diff:''}' 
		<?teng endif?>
	};
	
	exeResponse(answer,'rss');
<?teng endformat?>
