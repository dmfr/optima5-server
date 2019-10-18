<?php
session_start() ;

$app_root = dirname($_SERVER['SCRIPT_NAME']).'/../../..' ;
$server_root=$app_root.'/server' ;
$resources_root=$app_root.'/resources' ;
$templates_dir=$resources_root.'/server/templates' ;

@include_once 'PHPExcel/PHPExcel.php' ;

include("$server_root/include/config.inc.php");
include("$server_root/include/toolfunctions.inc.php");
include("$server_root/modules/media/include/media.inc.php");

include( "$server_root/include/database/mysql_DB.inc.php" ) ;
$_opDB = new mysql_DB( );
$_opDB->connect_mysql( $mysql_host, $mysql_db, $mysql_user, $mysql_pass );
$_opDB->query("SET NAMES UTF8") ;





$resources_root = $GLOBALS['resources_root'] ;
if( !@include_once("{$resources_root}/php-ntlm/src/Autoloader/autoload.php") ) {
	//echo "?" ;
	return ;
}
if( !@include_once("{$resources_root}/php-ews/src/Autoloader/autoload.php") ) {
	//echo "?" ;
	return ;
}

if (!@include_once("{$resources_root}/php-mailer/src/Autoloader/autoload.php") ) {
	echo "?" ;
	return ;
}



$mail = PhpMailer::getInstance() ;
$smtp = PhpMailer::getSMTP();
//print_r($smtp) ;
//return ;

$mail->IsSMTP() ;
$mail->Host = "webmail.quinoa-groupe.fr";
$mail->SMTPDebug = 2;
$mail->SMTPSecure = 'ssl';
$mail->SMTPAuth = true;
$mail->Port = 465;
$mail->Username = "relance@quinoa-groupe.fr" ;
$mail->Password = "c20023Zz1" ;


$mail->CharSet = "utf-8";

$mail->From = 'relance@quinoa-groupe.fr';
$mail->FromName = 'rayane test';
$mail->AddAddress('rayane.bensaid@recouveo-si.com', 'rayane yesy2');
$mail->IsHTML(true);                                  // Set email format to HTML

$mail->Subject = 'Here is the subject';
$mail->Body    = 'This is the HTML message body <strong>in bold!</strong>';
$mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

if(!$mail->Send()) {
	echo 'Message could not be sent.';
	print_r($mail->ErrorInfo);
	exit;
}

?>
