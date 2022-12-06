<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>
<?teng if $.status == 200?>
		{
			status :200,
			method : 'setNote',

			<?teng frag noteAttributes ?>
				note : {
					content :"<?teng ctype "jshtml"?>${content}<?teng endctype?>",
					parsedContent : "<?teng ctype "quoted-string"?>${parsedContent}<?teng endctype?>"
				}
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
