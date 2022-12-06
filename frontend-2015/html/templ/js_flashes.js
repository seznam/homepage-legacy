<?teng format space="joinlines"?>
	var answer = {
		flashes :[
		<?teng frag items?>
			{id:${_number}, time:'${title}', link:'${link}', text:'${description}'}${$_number != $_count-1 ? ',' :''}
		<?teng endfrag ?>
		]
	};
	<?teng if $.items._count > 0?>
		exeResponse(answer,'flashes');
	<?teng endif?>
<?teng endformat?>
