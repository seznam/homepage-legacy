<?teng format space="onespace"?>
	<?teng if exist(emailWindow)?>
			var answer = {
			email : {
				type		:'table',
				htmlCode 	: '<?teng include file="_email_table.html"?>'
			}
		};
	<?teng else?>
		var answer = {
			email : {
				type		:'form',
				htmlCode	: '<?teng include file="_email_login.html"?>'
			}
		};
	<?teng endif?>
	<?teng frag error?>
		var answer = {
			email : {
				type		:'error',
				htmlCode	: ''
			}
		};
	<?teng endfrag?>
	exeResponse(answer,'email');
<?teng endformat?>
