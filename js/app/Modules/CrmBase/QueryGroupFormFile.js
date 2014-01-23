Ext.define('Optima5.Modules.CrmBase.QueryGroupFormFile' ,{
	extend: 'Optima5.Modules.CrmBase.QueryGroupForm',
			  
	requires: [
		'Optima5.Modules.CrmBase.QueryGroupForm'
	] ,
			  
	bibleId: '',
	bibleMapNode: null, 
			  
	initComponent: function() {
		var me = this ;
		
		if( me.fileMapNode != null ) {
			
			var fields = [] ;
			
			var occur ;
			
			me.fileMapNode.eachChild( function(node) {
				if( node === me.fileMapNode ){
					return true ; // on skip le node parent/root (même instance que "me.bibleMapNode")
				}
				
				occur = {
					field_code: node.get('field_code'),
					field_text: node.get('field_text')
				};
				
				fields.push(occur) ;
				
				//console.log( 'Cascade : '+node.get('field_code') ) ;
			},me) ;
		}
		
		
		Ext.apply( me, {
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75
			},
			layout: 'anchor',
			items:[{
				xtype: 'fieldset',
				title: 'Group by file record',
				defaultType: 'textfield',
				defaults: {anchor: '100%'},
				layout: 'anchor',
				items: [{
					xtype:'numberfield',
					//width:60 ,
					minValue: 0,
					maxValue: 10,
					allowDecimals: false,
					fieldLabel: 'Max.records',
					name:'group_file_limit_nb'
				}]
			},{
				xtype: 'fieldset',
				title: 'Display Fields',
				defaultType: 'textfield',
				defaults: {anchor: '100%'},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					name: 'group_file_display_record',
					forceSelection: true,
					editable: false,
					multiSelect: true,
					store: {
						fields: ['field_code','field_text'],
						data : fields
					},
					queryMode: 'local',
					displayField: 'field_text',
					valueField: 'field_code',
					valueField: 'field_code'
				}]
			}]
		}) ;
		
		
		
		this.callParent() ;
	},
	calcLayout: function(){
		var me = this ;
	}
}) ;