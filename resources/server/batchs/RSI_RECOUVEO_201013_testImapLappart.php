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


$mail = PhpMailer::getInstance() ;

// Instantiation and passing `true` enables exceptions
//$mail = new PHPMailer(true);

try {
    //Server settings
    $mail->SMTPDebug = 2;                      // Enable verbose debug output
    $mail->isSMTP();                                            // Send using SMTP
    $mail->Host       = 'SMTP.GMAIL.COM';                    // Set the SMTP server to send through
    $mail->SMTPAuth   = true;                                   // Enable SMTP authentication
    $mail->Username   = 'recouvrement@l-appart.net';                     // SMTP username
    $mail->Password   = 'R3couveo20!';                               // SMTP password
    $mail->SMTPSecure = 'tls';         // Enable TLS encryption; `PHPMailer::ENCRYPTION_SMTPS` encouraged
    $mail->Port       = 587;                                    // TCP port to connect to, use 465 for `PHPMailer::ENCRYPTION_SMTPS` above

    //Recipients
    $mail->setFrom('recouvrement@l-appart.net', 'Recouvrement');
    $mail->addAddress('dm@mirabel-sil.com', 'Damien Mirand');     // Add a recipient
    // Content
    $mail->isHTML(true);                                  // Set email format to HTML
    $mail->Subject = 'Here is the subject';
    $mail->Body    = 'This is the HTML message body <b>in bold!</b>';
    $mail->AltBody = 'This is the body in plain text for non-HTML mail clients';

    $mail->send();
    echo 'Message has been sent';
} catch (Exception $e) {
    echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
}

exit ;

		/* connect to IMAP */
		$hostname = '{'.'imap.gmail.com:993/debug/imap/ssl/novalidate-cert'.'}'.'INBOX' ;
		$username = 'recouvrement@l-appart.net';
		$password = 'R3couveo20!';
		
		
		/*
		$hostname = '{'.'mail.mirabel-sil.com:993/imap/ssl/novalidate-cert'.'}'.'INBOX' ;
		$username = 'dm@mirabel-sil.com';
		$password = 'diona34';
		*/

		/* try to connect */
		$imap = imap_open($hostname,$username,$password) ;
		if( !$imap ) {
			echo "failed to connect/login {{$hostname}}\n" ;
			//continue ;
		}
		$inbox_uids = imap_search($imap, 'ALL', SE_UID);
		print_r($inbox_uids) ;
















?>
