Ext.define('Optima5.Modules.UxNotepad.UxNotepadWindow', {
	extend: 'Ext.window.Window',
	requires: [
		'Ext.form.field.HtmlEditor'
	],
	
	initComponent : function(){
		 Ext.apply(this,{
			animCollapse:false,
			border: false,
			// IE has a bug where it will keep the iframe's background visible when the window
			// is set to visibility:hidden. Hiding the window via position offsets instead gets
			// around this bug.
			hideMode: 'offsets',
			layout: 'fit',
			items: [{
					xtype: 'htmleditor',
					value: [
							'Some <b>rich</b> <font color="red">text</font> goes <u>here</u><br>',
							'Give it a try!'
					].join('')
			}]
		});
		this.callParent() ;
	}
});