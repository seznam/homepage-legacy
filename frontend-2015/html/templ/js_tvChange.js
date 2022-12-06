<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>

<?teng if $.status == 200?>
	{
		status:200,
		method: 'getChannels',
		<?teng frag tv?>
		type : '${.type}',
			<?teng if $.type =~ 'tips'?>
			items : [
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
			]
			<?teng else?>
			items : [
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

