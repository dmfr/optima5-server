Ext.define('Optima5.Modules.CrmBase.QueryWhereFormBoolean' ,{
	extend: 'Optima5.Modules.CrmBase.QueryWhereForm',
			  
	requires: [
		'Optima5.Modules.CrmBase.QueryWhereForm'
	] ,
			  
	bibleId: '',
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75
			},
			layout: 'anchor',
			items:[{
				xtype: 'fieldset',
				title: 'Boolean value',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'radiogroup',
					//fieldLabel: 'Boolean value',
					// Arrange radio buttons into two columns, distributed vertically
					columns: 1,
					vertical: true,
					items: [
						{ boxLabel: '<i>no condition</i>', name: 'condition_bool', inputValue: '' },
						{ boxLabel: 'True', name: 'condition_bool', inputValue: 'true'},
						{ boxLabel: 'False', name: 'condition_bool', inputValue: 'false' }
					]
				}]
			}]
		});
		
		this.callParent() ;
	},
	calcLayout: function(){
		var me = this ;
		
		var curSelect = me.getValues()['condition_bible_mode'] ;
		
		Ext.Array.each( me.query('>fieldset') , function(f){
			if( typeof f.hiddenMid !== 'undefined' ) {
				f.setVisible( curSelect == f.hiddenMid ) ;
			}
		},me) ;
	}
});
