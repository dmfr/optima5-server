Ext.define('Optima5.Modules.UxCalc.UxCalcModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.UxCalc.UxCalcComponent'
	],
	
	initModule: function() {
		var me = this ;
		
		var calc = Ext.create('Optima5.Modules.UxCalc.UxCalcComponent',{
			ui:'apple'
		});
		
		var win = me.createWindow({
			layout:'auto',
			width:197,
			height:277,
			resizable:true,
			maximizable:false,
			items:[calc],
			listeners:{
				afterrender:function(thiswin) {
					thiswin.getEl().relayEvent( 'keydown', calc ) ;
				},
				scope:me
			}
		}) ;
	}
});