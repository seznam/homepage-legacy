<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>

<?teng if $.status == 200?>
	{
		status:200,
		method: 'getCities',
		
		districts : [
			<?teng frag district?>
				{
					name : '<?teng ctype "quoted-string"?>${name}<?teng endctype?>',
					id : '${id}'
				} ${$_number != $_count-1? ',' : ''}
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
