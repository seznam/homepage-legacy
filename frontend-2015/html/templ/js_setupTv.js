<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>

<?teng if $.status == 200?>
	{
		status:200,
		method: 'setupTv'

		<?teng frag feed?>
			items : [
				<?teng frag items?>
						{
							description : '<?teng ctype "quoted-string"?>${description}<?teng endctype?>',
							link : '${link}',
							seznam_image : '#{PATH_FAVICO_TV}${$picture_url !~ '' ? '/' ++ $picture_url :  '_' ++ $id}',
							title : '${title}'
						} ${$_count-1 != $_number ? ',': ''}
				<?teng endfrag?>
			]
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
