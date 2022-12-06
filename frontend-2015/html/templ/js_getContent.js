<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>

<?teng if $.status == 200?>
	{
		status:200,
		method: 'getContent',
		hashid: '${.hashId}',
		feeds: [
		<?teng frag columns?>
				<?teng frag feed?>
					<?teng include file="_js_feeds_update.js"?>
				<?teng endfrag?>
		<?teng endfrag?>
				{}
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
