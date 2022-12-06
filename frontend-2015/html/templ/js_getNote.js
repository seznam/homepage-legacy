<?teng frag result?>
	{
		status: ${status},
        statusMessage: '${statusMessage}',
		method: 'getNote'<?teng if exist(content)?>,
        content: '<?teng ctype "quoted-string"?>${content}<?teng endctype?>'<?teng endif?>
	}
<?teng endfrag?>

<?teng if isenabled("debug")?>
/*-
<?teng debug?>
*/
<?teng endif?>
