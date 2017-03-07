<?php

function settings_password_change( $post_data ) {
	global $_opDB ;
	
	$login_userId = $_SESSION['login_data']['login_user'] ;
	$old_password_sha1 = sha1($login_userId.AUTH_SHA1_SALT.trim($post_data['old_password'])) ;
	$query = "SELECT * FROM auth_user WHERE user_id='$login_userId' AND password_sha1='{$old_password_sha1}'" ;
	$result = $_opDB->query($query) ;
	if( $_opDB->num_rows($result) != 1 )
	{
		return array(
			'success' => FALSE,
			'errors'=>array(
				'old_password'=>"Invalid password for user=<b>{$login_userId}</b>"
			)
		) ;
	}
	
	$new_password_plain = $_opDB->escape_string($post_data['new_password']) ;
	$new_password_sha1 = sha1($login_userId.AUTH_SHA1_SALT.trim($post_data['new_password'])) ;
	$query = "UPDATE auth_user SET password_plaintext='{$new_password_plain}',password_sha1='{$new_password_sha1}'
			WHERE user_id='$login_userId' AND password_sha1='{$old_password_sha1}'" ;
	$_opDB->query($query) ;
	return array('success',true) ;
}

?>
