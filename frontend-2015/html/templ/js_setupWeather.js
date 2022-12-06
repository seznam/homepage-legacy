<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>

<?teng if $.status == 200?>
	{
		status:200,
		method: 'setupWeather',
		
		<?teng frag feedAttributes?>
			title : '<?teng ctype "quoted-string"?>${title}<?teng endctype?>',
			
			items : [
				<?teng frag items?>
					{ 
						daymax : '${daymax}',
						daymin : '${daymin}',
						weather : '${weather}'
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
