{
	status : 200,
	method : 'catalogueABC',
	letters : [
		<?teng frag letter?>	
			{
				smallLetter : '${smallLetter}',
				letter : '${letter}',
					
				items : [
					<?teng frag item?>
					{
						title:'${title}',
						lnk:'#{SERVER_CATALOGUE_URL}/${link}'
					} ${$_count-1 != $_number ? ',' : ''}
					<?teng endfrag?>
				]
			} ${$_count-1 != $_number ? ',' : ''}
		<?teng endfrag?>
	]
}

/*
<?teng debug?>
*/

