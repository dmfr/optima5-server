Ext.define('Optima5.Modules.Spec.WbMrfoxy.MainWindow',{
	extend:'Ext.window.Window',
	requires:[
	],
	
	initComponent: function() {
		var me = this,
			moduleRecord = me.optimaModule.getSdomainRecord() ;
		
		Ext.apply(me,{
			width:250,
			height:600,
			resizable:false,
			maximizable:false,
			layout:'fit',
		});
		
		this.callParent() ;
	}
}) ;