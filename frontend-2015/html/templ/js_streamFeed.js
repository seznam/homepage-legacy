<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>

<?teng if $.status == 200?>
	{
		status:200,
		method: 'getStreamFeed',

		items : [
			<?teng frag stream?>
				<?teng if $_number+1 <= $rowCount ?>
					{
						title : '<?teng ctype "quoted-string"?>${title}<?teng endctype?>',
						description : '<?teng ctype "quoted-string"?>${$showPreview ? $description: ''}<?teng endctype?>',
						link : '${link}',
						icon_id : '${icon_id}',
						showPreview : '${showPreview}',
						seznamImage : '${seznam_image}',
						rowCount : '${rowCount}'
					} ${$_number+1 < $rowCount ? ',' : ''}
				<?teng endif?>
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
