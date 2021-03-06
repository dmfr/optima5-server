Ext.define('WbBudgetCfgCropModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'crop_year', type: 'string'},
        {name: 'date_apply', type: 'string'},
		  {name: 'is_current', type: 'boolean'},
		  {name: 'is_preview', type: 'boolean'}
    ]
}) ;


Ext.define('Optima5.Modules.Spec.WbBudget.WbBudgetModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.WbBudget.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.createWindow({
			width:800,
			height:600,
			resizable:true,
			maximizable:false,
			layout:'fit',
			items:[Ext.create('Optima5.Modules.Spec.WbBudget.MainPanel',{
				optimaModule: me,
				border: false
			})]
		}) ;
	},
	postCrmEvent: function( crmEvent, postParams ) {
		this.callParent(arguments) ;
	}
});