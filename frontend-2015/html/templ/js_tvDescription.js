<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>

<?teng if $.status == 200?>
	{
		status:200,
		method: 'getDescription',
		<?teng if exist(tv)?>
			<?teng frag tv?>
				description : '<?teng ctype "quoted-string"?>${description}<?teng endctype?>',
				type:'${type}',
				time : '${date("%H:%M", $time)}',
				channel : '${channel}',
				title : '${title}'
			<?teng endfrag?>
		<?teng else?>
			description : 'O programu nejsou známy bližší informace.',
				type:'',
				time : '',
				channel : '',
				title : ''
		<?teng endif?>
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
