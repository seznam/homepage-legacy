<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>

<?teng if $.status == 200?>
		{
			status :200,
			method : 'getFeedList',
			selectedFeeds : [
				<?teng frag userFeedIds?>
					{feedId : ${ id}} ${$_number != $_count-1 ? ',' : ''}
				<?teng endfrag?>
			],
			groups : [
				<?teng frag group?>
					{
						groupId : '${groupId}',
						<!---userSearchId : '${userSearchId}',--->
						name : '<?teng ctype "quoted-string"?>${name}<?teng endctype?>',
						isHidden : '${isHidden}' ${exist(feed) ? ',' :''}
						
						
						
						<?teng if exist(feed)?>
							feeds: [
								<?teng frag feed?>
									{
											feedId : '${feedId}',
											groupId : '${groupId}',
											typeId : '${typeId}',
											selected : '${selected}',
											serverUrl : '${serverUrl}',
											url	: '${url}',
											title : '<?teng ctype "quoted-string"?>${title}<?teng endctype?>'								
									} ${$_number != $_count-1 ? ',' : ''}
									
								<?teng endfrag?>
							]
						<?teng endif?>
						
					} ${$_number != $_count-1 ? ',' : ''}
					
				<?teng endfrag?>
			]
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
