<?teng frag .columns?>
	<?teng frag feed?>
		<?teng include file="_feeds.html"?>
	<?teng endfrag?>
<?teng endfrag?>

<?teng format space="noformat"?>
<?teng if isenabled("errorfragment")?>
<pre style=" text-align:left; border:2px solid #a0a0a0; padding:8px; background:#efefef; color:#ff0000; font-family:sans; font-size:12px;">
<?teng frag ._error?>
${filename}: Line [${line}] : Coll [${column}] : ${message}
<?teng endfrag?>
</pre>
<?teng endif?>
<?teng if isenabled("debug")?>
<pre style=" text-align:left; border:2px solid #a0a0a0; padding:8px; background:#efefef; color:#33cc00; font-family:sans; font-size:12px;">
<?teng debug?>
</pre>
<?teng endif?>
<?teng endformat?>

