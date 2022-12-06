<?teng frag result?>
	{
		status: ${status},
        statusMessage: '${statusMessage}',
		method: 'getSelectedNote'<?teng if exist(note)?>,
        note: ${note}<?teng endif?>
	}
<?teng endfrag?>

<?teng if isenabled("debug")?>
/*-
<?teng debug?>
*/
<?teng endif?>
