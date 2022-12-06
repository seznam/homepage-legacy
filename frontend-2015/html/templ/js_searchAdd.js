<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>
<?teng if $.status == 200?>
	<?teng frag searches?>
		{
			status:'200',
			method: 'searchAdd',
			item :  
				<?teng frag search?>
					<?teng if $_number == $_count-1?>
						{
							groupId : '${groupId}',
							searchId : '${searchId}',
							userSearchId : '${userSearchId}',
							title : '${title}',
							serviceUrl : '${serviceUrl}',
							url : '${url}',
							encoding : '${encoding}',
							isHidden : '${isHidden}'
						} 
					<?teng endif?>
				<?teng endfrag?>
			
		}
	<?teng endfrag?>
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
