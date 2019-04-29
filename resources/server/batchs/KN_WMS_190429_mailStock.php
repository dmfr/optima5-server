<?php

@include_once 'PHPMailer/PHPMailerAutoload.php';

$URL = "http://10.39.1.1:8080/paracrm.kn/server/report.xml.php" ;

$PARAMS_BASE = array(
'PHP_AUTH_USER' => 'uploader@kn',
'PHP_AUTH_PW'   => 'password',
'_moduleId'     => 'spec_dbs_lam',
'_sdomainId'    => 'lmx',
'_action'       => 'xls_qsqlExec',
'qsql_id'       => 'STK_Report'
) ;
if( $soc=getenv('SOC') ) {
$PARAMS_BASE += array(
'vars'        => json_encode(array(
        'soc_code' => $soc
))
) ;
}




$ts_exec = time();

$mail_to = getenv('MAIL_TO') ;
if( !$mail_to ) {
	die() ;
}

	// do http post
	$data = http_build_query($PARAMS_BASE) ;
	$params = array('http' => array(
					'method' => 'POST',
					'content' => $data,
					'timeout' => 300
					));
	$ctx = stream_context_create($params);
	$fp = @fopen($URL, 'rb', false, $ctx);
	
	$bin = stream_get_contents($fp) ;
	
	//echo strlen($bin) ;
	
	$filename = "LMX_Stock_".date('Y-m-d').'.xlsx' ;
	if( $soc=getenv('SOC') ) {
		$filename = "LMX_Stock_{$soc}_".date('Y-m-d').'.xlsx' ;
	}
	
	//file_put_contents('/'.$filename,$bin) ;
	
	
$mail = new PHPMailer(true);                              // Passing `true` enables exceptions
    //Server settings
    $mail->isSMTP();                                      // Set mailer to use SMTP
    $mail->Host = '127.0.0.1';  // Specify main and backup SMTP servers

    //Recipients
    $mail->setFrom('nobody@mirabel-sil.com');
    foreach( explode(',',$mail_to) as $mail_to_adr ) {
	    $mail->addAddress($mail_to_adr);     // Add a recipient
    }

    //Attachments
    $mail->addStringAttachment($bin, $filename) ;

    //Content
    $mail->isHTML(true);                                  // Set email format to HTML
    $mail->Subject = "LMX {$soc} Stock Report ".date('d/m/Y');
    $mail->Body    = 'Fichier joint : <b>'.$filename.'</b><br>';
    $mail->AltBody = 'Fichier joint : '.$filename.'<br>';

    $mail->send();


?>
