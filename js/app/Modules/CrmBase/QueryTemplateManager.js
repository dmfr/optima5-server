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

Ext.define('Optima5.Modules.CrmBase.QueryTemplateManager' ,{
	singleton: true,
	
	loadStyle: function(optimaModule) {
		if( (optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QueryPanel','No module reference ?') ;
		}
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: 'queries_gridTemplate',
			_subaction: 'load'
		});
		optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					settingsRecord = Ext.create('QueryTemplateSettings',Ext.decode(response.responseText).data_templatecfg) ;
					Optima5.Modules.CrmBase.QueryTemplateManager.applySettingsRecord( optimaModule.sdomainId, settingsRecord ) ;
				}
			}
		});
	},
	applySettingsRecord: function( sdomainId, settingsRecord ) {
		Ext.util.CSS.removeStyleSheet('op5crmbaseQuerygrid-'+sdomainId);
		
		if( !settingsRecord.get('template_is_on') ) {
			return ;
		}
		
		
		var cssBlob = '',
			cssRoot = '.op5crmbase-querygrid-'+sdomainId+' ' ;
		
		columnColor = settingsRecord.get('colorhex_columns') ;
		cssBlob += cssRoot+".x-column-header { background-color:"+columnColor+"; background:"+columnColor+"; }\r\n" ;
		rowColor = settingsRecord.get('colorhex_row') ;
		cssBlob += cssRoot+".x-grid-row .x-grid-cell { background-color:"+rowColor+" }\r\n" ;
		rowColorAlt = settingsRecord.get('colorhex_row_alt') ;
		cssBlob += cssRoot+".x-grid-row-alt .x-grid-cell { background-color:"+rowColorAlt+" }\r\n" ;
		
		dataBold = settingsRecord.get('data_select_is_bold') ;
		cssBlob += cssRoot+".op5crmbase-datacolumn { font-weight:"+ (dataBold?'bold':'normal') +"; }\r\n" ;
		progressBold = settingsRecord.get('data_progress_is_bold') ;
		cssBlob += cssRoot+".op5crmbase-detachedcolumn { font-weight:"+ (progressBold?'bold':'normal') +"; }\r\n" ;
		cssBlob += cssRoot+".op5crmbase-progresscolumn { font-weight:"+ (progressBold?'bold':'normal') +"; }\r\n" ;
		
		textAlign = settingsRecord.get('data_align') ;
		cssBlob += cssRoot+".op5crmbase-datacolumn .x-grid-cell-inner { text-align:"+ textAlign +"; }\r\n" ;
		cssBlob += cssRoot+".op5crmbase-detachedcolumn .x-grid-cell-inner { text-align:"+ textAlign +"; }\r\n" ;
		cssBlob += cssRoot+".op5crmbase-progresscolumn .x-grid-cell-inner { text-align:left; }\r\n" ;
		
		cssBlob += cssRoot+".op5crmbase-detachedrow .op5crmbase-datacolumn  .x-grid-cell-inner { font-weight:"+ (progressBold?'bold':'normal') +"; text-align:"+ textAlign +"; }\r\n" ;
		
		cssBlob += cssRoot+".op5crmbase-progresscell-pos .x-grid-cell-inner { color: green; }\r\n" ;
		cssBlob += cssRoot+".op5crmbase-progresscell-neg .x-grid-cell-inner { color: red; }\r\n" ;
		
		Ext.util.CSS.createStyleSheet(cssBlob, 'op5crmbaseQuerygrid-'+sdomainId);
	}
});