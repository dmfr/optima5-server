Ext.define('Optima5.Modules.CrmBase.CrmDscModule', {
	extend: 'Optima5.Modules.CrmBase.CrmBaseModule',
	requires: [
		'Optima5.Modules.CrmBase.MainDscWindow'
	],
	
	initModule: function() {
		var me = this ;
		
		me.createWindow({},Optima5.Modules.CrmBase.MainDscWindow) ;
	}
});