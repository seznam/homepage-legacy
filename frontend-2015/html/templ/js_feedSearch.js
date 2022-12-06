<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>
<?teng if $.status == 200?>
		{
			status :200,
			method : ${exist(.addfeed) ? '\'feedSearchdAdd\'' :'\'feedSearch\''},
			<?teng frag feeds?>
				feedCount : '${numformat($.feeds.feed._count,0,',',' ')}',
				feeds : [
					<?teng frag feed?>
						{
							href : '${href}',
							title : '<?teng ctype "quoted-string"?>${title}<?teng endctype?>',
							id : ${id},
							groupId : '${groupId}'
						} ${$_number != $_count-1 ? ',' : ''}
					<?teng endfrag?>
				]
			<?teng endfrag?>

			<?teng frag addfeed?>
				feed : {
					feedId : '${feedId}',
					showPreview : '${showPreview}',
					groupId : '${groupId}'
				}
			<?teng endfrag?>
		}
<?teng else?>
	<?teng frag result?>
		{status:${status}, statusMessage : '${statusMessage}', feedCount: '0'}
	<?teng endfrag?>
<?teng endif?>

<?teng if isenabled("debug")?>
/*-
<?teng debug?>
*/
<?teng endif?>
