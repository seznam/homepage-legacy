<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>

<?teng if $.status == 200?>
	{
		status: 200,
		method: 'setupZodiac',
		
		<?teng frag feedAttributes?>
			title : '<?teng ctype "quoted-string"?>${title}<?teng endctype?>',
			<?teng frag items?>
				description : '<?teng ctype "quoted-string"?>${description}<?teng endctype?>',
				link : '${link}',
				seznam_image : '${seznam_image}',
				title : '${title}'
			<?teng endfrag?>
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
