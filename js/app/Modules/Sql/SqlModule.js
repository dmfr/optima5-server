Ext.define('Optima5.Modules.Sql.SqlModule', {
	extend: 'Optima5.Module',
	
	requires: [
	],
	
	initModule: function() {
		var me = this ;
		
		var win = me.createWindow({
			width:640,
			height:480,
			resizable:true,
			maximizable:false,
			items:[{
				xtype: 'panel'
			}]
		}) ;
	}
});
