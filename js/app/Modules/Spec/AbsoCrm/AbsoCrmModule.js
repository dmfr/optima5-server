Ext.define('Optima5.Modules.Spec.AbsoCrm.AbsoCrmModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.Spec.AbsoCrm.MainPanel'
	],
	
	moduleParams: null,
	
	initModule: function() {
		var me = this ;
		
		me.createWindow({
			width:1100,
			height:600,
			resizable:true,
			maximizable:false,
			layout:'fit',
			items:[Ext.create('Optima5.Modules.Spec.AbsoCrm.MainPanel',{
				optimaModule: me,
				border: false
			})]
		}) ;
	},
	postCrmEvent: function( crmEvent, postParams ) {
		this.callParent(arguments) ;
	}
});