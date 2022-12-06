<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>
<?teng if $.status == 200?>
	<?teng frag searches?>
		{
			status:'200',
			method: 'searchList',
			items : [
				<?teng frag search?>
					{
						groupId : '${groupId}',
						searchId : '${searchId}',
						userSearchId : '${userSearchId}',
						title : '<?teng ctype "quoted-string"?>${title}<?teng endctype?>',
						serviceUrl : '${serviceUrl}',
						url : '${url}',
						encoding : '${encoding}',
						isHidden : '${isHidden}'
					}
					${$_number != $_count-1 ? ',' : ''}
				<?teng endfrag?>
			]
		}
	<?teng endfrag?>
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
