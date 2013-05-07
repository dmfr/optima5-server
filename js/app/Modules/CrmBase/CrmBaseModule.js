Ext.define('Optima5.Modules.CrmBase.CrmBaseModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.CrmBase.MainWindow'
	],
	
	initModule: function() {
		var me = this ;
		
		var win = me.createWindow({},Optima5.Modules.CrmBase.MainWindow) ;
		win.show() ;
	}
});