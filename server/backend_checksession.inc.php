<?php
if( $_REQUEST['_sessionId'] == NULL )
{
	die( json_encode(array('sessionLost'=>true)) ) ;
	die( "pas de nom de session" );
}

session_name($_REQUEST['_sessionId']) ;
session_start() ;

if( !isset($_SESSION['login_data']) )
{
	die( json_encode(array('sessionLost'=>true)) ) ;
	die( "pas de session \" {$_POST['_sessionId']} \". Lien mal configure.");
}
elseif( $_SESSION['login_data']['time_access'] < strtotime( '-24 hours' ) )
{
	die( json_encode(array('sessionLost'=>true)) ) ;
	die( "session expiree" );
}
else
{
	$_SESSION['login_data']['time_access'] = time() ;
}
?>