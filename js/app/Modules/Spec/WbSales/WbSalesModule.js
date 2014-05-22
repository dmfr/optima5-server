Ext.define('WbSalesCfgCropModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'crop_year', type: 'string'},
        {name: 'date_apply', type: 'string'},
		  {name: 'is_current', type: 'boolean'},
		  {name: 'is_preview', type: 'boolean'}
    ]
}) ;

Ext.define('WbSalesCfgCountryModel', {
    extend: 'Ext.data.Model',
	 idProperty: 'id',
    fields: [
		{name: 'field_CODE', type: 'string'},
		{name: 'field_TXT', type: 'string'},
		{name: 'field_ICONURL', type: 'string'},
		{name: 'id', type: 'string', mapping:'field_CODE'},
		{
			name: 'text', type:'string', convert: function(v,record) {
				if( record.get('field_CODE') == '' ) {
					return '<b>All countries</b>' ;
				}
				return '<b>' + record.get('field_CODE') + '</b>' + ' - ' + record.get('field_TXT') ;
			}
		},
		{
			name: 'icon', type:'string', convert: function(v,record) {
				return record.get('field_ICONURL') ;
			}
		}
	 ]
}) ;


Ext.define('Optima5.Modules.Spec.WbSales.WbSalesModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.WbSales.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.addEvents('op5broadcast') ;
		
		me.createWindow({
			width:800,
			height:600,
			resizable:true,
			maximizable:false,
			layout:'fit',
			items:[Ext.create('Optima5.Modules.Spec.WbSales.MainPanel',{
				optimaModule: me,
				border: false
			})]
		}) ;
	},
	postCrmEvent: function( crmEvent, postParams ) {
		this.callParent(arguments) ;
	}
});