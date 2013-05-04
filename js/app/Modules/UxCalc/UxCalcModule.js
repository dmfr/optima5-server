Ext.define('Optima5.Modules.UxCalc.UxCalcModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.UxCalc.UxCalcComponent'
	],
	
	initModule: function() {
		var me = this ;
		
		var win = me.createWindow({
			width:170,
			height:280,
			resizable:false,
			items:[ Ext.create('Optima5.Modules.UxCalc.UxCalcComponent',{ui:'apple'}) ]
		}) ;
		win.show() ;
	}
});