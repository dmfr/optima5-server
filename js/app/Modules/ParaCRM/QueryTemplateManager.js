Ext.define('QueryTemplateSettings', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'template_is_on',  type: 'boolean'},
		{name: 'color_key',  type: 'string'},
		{name: 'colorhex_columns',   type: 'string'},
		{name: 'colorhex_row',   type: 'string'},
		{name: 'colorhex_row_alt',   type: 'string'},
		{name: 'data_align',   type: 'string'},
		{name: 'data_select_is_bold',   type: 'boolean'},
		{name: 'data_progress_is_bold',   type: 'boolean'}
	]
});
Ext.define('QueryTemplateColorModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'color_key',  type: 'string'},
		{name: 'color_lib',  type: 'string'},
		{name: 'colorhex_columns',   type: 'string'},
		{name: 'colorhex_row',   type: 'string'},
		{name: 'colorhex_row_alt',   type: 'string'}
	],
	idProperty:'color_key'
});

Ext.define('Optima5.Modules.ParaCRM.QueryTemplateManager' ,{
	singleton: true,
	
	loadStyle: function() {
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_action: 'queries_gridTemplate',
			_subaction: 'load'
		});
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					settingsRecord = Ext.create('QueryTemplateSettings',Ext.decode(response.responseText).data_templatecfg) ;
					Optima5.Modules.ParaCRM.QueryTemplateManager.applySettingsRecord( settingsRecord ) ;
				}
			}
		});
	},
	applySettingsRecord: function( settingsRecord ) {
		Ext.util.CSS.removeStyleSheet('op5paracrmQuerygrid');
		
		if( !settingsRecord.get('template_is_on') ) {
			return ;
		}
		
		
		var cssBlob = '' ;
		
		columnColor = settingsRecord.get('colorhex_columns') ;
		cssBlob += ".op5paracrm-querygrid .x-column-header { background-color:"+columnColor+"; background:"+columnColor+"; }\r\n" ;
		rowColor = settingsRecord.get('colorhex_row') ;
		cssBlob += ".op5paracrm-querygrid .x-grid-row .x-grid-cell { background-color:"+rowColor+" }\r\n" ;
		rowColorAlt = settingsRecord.get('colorhex_row_alt') ;
		cssBlob += ".op5paracrm-querygrid .x-grid-row-alt .x-grid-cell { background-color:"+rowColorAlt+" }\r\n" ;
		
		dataBold = settingsRecord.get('data_select_is_bold') ;
		cssBlob += ".op5paracrm-querygrid .op5paracrm-datacolumn { font-weight:"+ (dataBold?'bold':'normal') +"; }\r\n" ;
		progressBold = settingsRecord.get('data_progress_is_bold') ;
		cssBlob += ".op5paracrm-querygrid .op5paracrm-progresscolumn { font-weight:"+ (progressBold?'bold':'normal') +"; }\r\n" ;
		
		textAlign = settingsRecord.get('data_align') ;
		cssBlob += ".op5paracrm-querygrid .op5paracrm-datacolumn .x-grid-cell-inner { text-align:"+ textAlign +"; }\r\n" ;
		cssBlob += ".op5paracrm-querygrid .op5paracrm-progresscolumn .x-grid-cell-inner { text-align:left; }\r\n" ;
		
		cssBlob += ".op5paracrm-querygrid .op5paracrm-progresscell-pos .x-grid-cell-inner { color: green; }\r\n" ;
		cssBlob += ".op5paracrm-querygrid .op5paracrm-progresscell-neg .x-grid-cell-inner { color: red; }\r\n" ;
		
		Ext.util.CSS.createStyleSheet(cssBlob, 'op5paracrmQuerygrid');
	}
});