<?teng set status = 0?>
<?teng frag result?>
<?teng set .status = $status?>
<?teng endfrag?>

<?teng if $.status == 200?>
	{
		status:200,
		method: 'setupEmail',
		
		<?teng frag emailWindow?>
			newMessages : '${newMessages}',
		<?teng endfrag?>
		
		items : [
		<?teng frag emailWindow?>
				<?teng frag message?>
						{ 
							<?teng set subjectEscaped = ($subject)?>
							<?teng set abstractEscaped = ($abstract)?>
							abstractText : '<?teng ctype "quoted-string"?>${abstractEscaped}<?teng endctype?>',
							subject : '<?teng ctype "quoted-string"?>${subjectEscaped}<?teng endctype?>',
							from : '<?teng ctype "quoted-string"?>${from}<?teng endctype?>',
							folderId : '${folderId}',
							<?teng format space="onespace"?>
							timestamp : '
								<?teng set nowH = date("%H",now())?>
								<?teng set nowM = date("%M",now())?>
								<?teng set nowS = date("%S",now())?>
								<?teng set nowT = $nowS+$nowM*60+$nowH*3600?>
								<?teng set firstMidnight = now() - $nowT?>
								<?teng set secondMidnight = $firstMidnight - 86400?>
								<?teng if $timestamp > $firstMidnight ?>
									${date("%H:%M",$timestamp)}
								<?teng elseif $timestamp > $secondMidnight?>
									Včera
								<?teng else?>
									${date("%e.%n.",$timestamp)}
								<?teng endif?>
							',
							<?teng endformat?>
							unread : '${unread}',
							messageId : '${messageId}'
						} ${$_count-1 != $_number ? ',': ''}
				<?teng endfrag?>
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
