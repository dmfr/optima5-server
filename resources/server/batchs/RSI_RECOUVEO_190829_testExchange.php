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
	
	
	
	
	
	$exchange_server = 'exchange07://webmail.quinoa-groupe.fr' ;
	$email_adr = 'relance@quinoa-groupe.fr' ;
	$username = 'relance@quinoa-groupe.fr' ;
	$password = 'c20023Zz1' ;
	$version = substr($exchange_server, 8, 2) ;
	$prefix = substr($exchange_server, 13) ;
	$version22 = "Exchange20".$version ;

	try {
		$ews = new \jamesiarmes\PhpEws\Client($prefix, $username, $password, $version22);
	} catch( Exception $e ) {
		return FALSE ;
	}


	$request = new \jamesiarmes\PhpEws\Request\FindItemType();
	$itemProperties = new \jamesiarmes\PhpEws\Type\ItemResponseShapeType();
	$itemProperties->BaseShape = \jamesiarmes\PhpEws\Enumeration\DefaultShapeNamesType::ID_ONLY;
	$itemProperties->BodyType = \jamesiarmes\PhpEws\Enumeration\BodyTypeResponseType::TEXT;
	$request->ItemShape = $itemProperties;

	$request->ParentFolderIds = new \jamesiarmes\PhpEws\ArrayType\NonEmptyArrayOfBaseFolderIdsType();
	$request->ParentFolderIds->DistinguishedFolderId = new \jamesiarmes\PhpEws\Type\DistinguishedFolderIdType();
	$request->ParentFolderIds->DistinguishedFolderId->Id = \jamesiarmes\PhpEws\Enumeration\DistinguishedFolderIdNameType::INBOX;
	if( $email_adr != $username ) {
		$request->ParentFolderIds->DistinguishedFolderId->Mailbox = new StdClass;
		$request->ParentFolderIds->DistinguishedFolderId->Mailbox->EmailAddress = $email_adr;
	}


	$request->Traversal = \jamesiarmes\PhpEws\Enumeration\ItemQueryTraversalType::SHALLOW;

	$result = new \jamesiarmes\PhpEws\Response\FindItemResponseMessageType();
	try {
		$result = $ews->FindItem($request);
	} catch( Exception $e ) {
		var_dump($e) ;
		exit ;
	}
	
	if ($result->ResponseMessages->FindItemResponseMessage[0]->ResponseCode == 'NoError' && $result->ResponseMessages->FindItemResponseMessage[0]->ResponseClass == 'Success') {
    $count = $result->ResponseMessages->FindItemResponseMessage[0]->RootFolder->TotalItemsInView;
    
    echo "count : {$count}\n" ;

    for ($i = 0; $i < $count; $i++){
        $message_id = $result->ResponseMessages->FindItemResponseMessage[0]->RootFolder->Items->Message[$i]->ItemId->Id;
        if( !$message_id ) {
			continue ;
        }
        echo "message : {$message_id}\n" ;
		}
	}

















?>
