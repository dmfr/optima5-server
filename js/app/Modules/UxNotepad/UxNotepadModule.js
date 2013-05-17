Ext.define('Optima5.Modules.UxNotepad.UxNotepadModule', {
	extend: 'Optima5.Module',
	requires: [
		'Optima5.Modules.UxNotepad.UxNotepadWindow'
	],
	
	initModule: function() {
		var me = this ;
		
		var win = me.createWindow({
			width:600,
			height:400
		},Optima5.Modules.UxNotepad.UxNotepadWindow) ;
	}
});