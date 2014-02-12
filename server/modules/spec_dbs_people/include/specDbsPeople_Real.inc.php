<?php

function specDbsPeople_Real_getData( $post_data ) {
	global $_opDB ;
	
	$sql_dates = array() ;
	$cur_date = date('Y-m-d',strtotime($post_data['date_start'])) ;
	while( strtotime($cur_date) <= strtotime($post_data['date_end']) ) {
		$sql_dates[] = $cur_date ;
		$cur_date = date('Y-m-d',strtotime('+1 day',strtotime($cur_date))) ;
	}
	
	$TAB = array() ;
	$query = "SELECT * FROM view_bible_RH_PEOPLE_tree t, view_bible_RH_PEOPLE_entry e
					WHERE t.treenode_key=e.treenode_key ORDER BY e.field_PPL_FULLNAME" ;
	$result = $_opDB->query($query) ;
	while( ($arr = $_opDB->fetch_assoc($result)) != FALSE ) {
		$row = array() ;
		$row['people_id'] = $arr['field_PPL_CODE'] ;
		$row['people_name'] = $arr['field_PPL_FULLNAME'] ;
		$row['people_techid'] = $arr['field_PPL_TECHID'] ;
		if( rand(0,10) < 5 || in_array($row['people_id'],array('BENNIAABDEL','BLINTHOMAS')) ) {
			$row['whse_code'] = 'AMN80_BAT1' ;
		} else {
			$row['whse_code'] = 'AMN80_BAT2' ;
		}
		
		$row['std_role_code'] = 'PRE' ;
		$row['std_length_hours'] = 7 ;
		
		$rand = rand(0,10) ;
		if( $rand > 9 ) {
			$row['team_code'] = 'WE1' ;
		} elseif( $rand > 8 ) {
			$row['team_code'] = 'WE2' ;
		} elseif( $rand > 4 ) {
			$row['team_code'] = 'APM_MAT' ;
		} else {
			$row['team_code'] = 'MAT_APM' ;
		}
		
		foreach( $sql_dates as $cur_date ) {
			$row['date_sql'] = $cur_date ;
			
			$role_code_std = $row['role_code'] ;
			
			$slices = array() ;
			if( TRUE ) {
				$slices[] = array(
					'role_class' => 'IN',
					'role_code'=> $row['std_role_code'],
					'length_hours'=> 7
				) ;
			}
			if( in_array($row['people_id'],array('BENNIAABDEL','BLINTHOMAS')) && $cur_date == '2014-02-10' ) {
				$slices = array() ;
				$slices[] = array(
					'whse_code' => 'AMN80_BAT2',
					'whse_is_alt'=> TRUE,
					'length_hours'=> 7
				) ;
			}
			$row['slices'] = $slices ;
			
			$TAB[] = $row ;
			if( in_array($row['people_id'],array('BENNIAABDEL','BLINTHOMAS')) && $cur_date == '2014-02-10' ) {
				$row['alt_whse_code'] = TRUE ;
				$row['whse_code'] = 'AMN80_BAT2' ;
				$row['slices'] = array(array(
					'role_class' => 'IN',
					'role_code'=> $row['std_role_code'],
					'length_hours'=> 7
				)) ;
				$TAB[] = $row ;
				$row['whse_code'] = 'AMN80_BAT1' ;
				$row['alt_whse_code'] = FALSE ;
			}
		}
	}

	return array('success'=>true, 'data'=>$TAB) ;
}

?>