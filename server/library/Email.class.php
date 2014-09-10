<?php
@include_once 'PHPMailer/PHPMailerAutoload.php';

class Email {

	private $str_From = "nobody@nodomain.com" ;
	private $str_Subject ;
	private $arr_recipients = array() ;

	private $str_main_body = '' ;

	private $IsHTML ;
	
	private $arrAttachments = array() ;
	
	function set_From( $from, $from_name=NULL )
	{
		$this->str_From = $from ;
		$this->str_FromName = ( $from_name ? $from_name : $from ) ;
	}
	function set_Subject( $ch )
	{
		$this->str_Subject = $ch ;
	}

	function add_Recipient( $email )
	{
		$this->arr_recipients[] = $email ;
	}
	
	
	
	function set_HTML_body( $str )
	{
		$this->str_main_body = $str ;
		$this->IsHTML = TRUE ;
	}
	function set_text_body( $str )
	{
		$this->str_main_body = $str ;
	}
	
	
	
	function attach_file( $filename, $filedata, $mime_type ) {
		$this->arrAttachments[] = array(
			'binary' => $filedata,
			'type' => $mime_type,
			'filename' => $filename
		) ;
	}
	
	
	function attach_textfile( $filename, $filedata )
	{
		$this->attach_file( $filename, $filedata, 'text/plain' ) ;
		return 0 ;
	}
	function attach_xlsfile( $filename, $filedata )
	{
		$this->attach_file( $filename, $filedata, 'application/vnd.ms-excel' ) ;
		return 0 ;
	}
	function attach_binary( $filename, $filedata )
	{
		$this->attach_file( $filename, $filedata, 'application/octet-stream' ) ;
		return 0 ;
	}
	
	
	
	
	function send() {
		if( !class_exists('PHPMailer') ) {
			echo "Email : PHPMailer not found<br>\n";
			return ;
		}
		$mail = new PHPMailer;
		$mail->CharSet = "UTF-8";
		
		$mail->isSMTP() ;
		$mail->Host = '127.0.0.1' ;
		
		$mail->From = $this->str_From;
		$mail->FromName = $this->str_FromName;
		foreach( $this->arr_recipients as $recipient ) {
			$mail->addAddress($recipient);
		}
		
		$mail->WordWrap = 70 ;
		foreach( $this->arrAttachments as $attachment ) {
			$mail->addStringAttachment($attachment['binary'], $attachment['filename'], 'base64', $attachment['type'] );
		}
		
		if( $this->IsHTML )
		{
			$email_src = $this->str_main_body ;
			$mail->isHTML(true);
			$mail->Body = $email_src ;
			$mail->AltBody = strip_tags($email_src) ;
		}
		else {
			$email_src = $this->str_main_body ;
			$mail->Body = $email_src ;
		}
		
		$mail->Subject = $this->str_Subject ;
		
		if(!$mail->send()) {
			echo "Message could not be sent.<br>\n";
			echo 'Mailer Error: ' . $mail->ErrorInfo."<br>\n";
		}
	}
}
?>
