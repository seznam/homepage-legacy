<?teng frag result?>
	<?teng if $mode =~ 'iframe'?>
		<html lang="cs">
			<head>
				<title></title>
			</head>
			<body>
				<script type="text/javascript">
					document.domain = '#{DOMAIN}';
					var data = {
						"picture": "#{PATH_SKINS}/#{PATH_SKINS_USER}/#{PATH_SKINS_TMP}/${file}.jpg",
						"status": "${status}"
					}
					top.Homepage.ownSkin.processUploadAndCreatePrew(data);
				</script>
			</body>
		</html>
	<?teng else?>
		{
			"picture": "#{PATH_SKINS}/#{PATH_SKINS_USER}/#{PATH_SKINS_TMP}/${file}.jpg",
			"status": "${status}"
		}
	<?teng endif?>
<?teng endfrag?>
<!---
<?teng if isenabled("debug")?>
/*-
<?teng debug?>
*/
<?teng endif?>
--->
