Ext.define('Optima5.Modules.CrmBase.QueryGroupFormBible' ,{
	extend: 'Optima5.Modules.CrmBase.QueryGroupForm',
			  
	requires: [
		'Optima5.Modules.CrmBase.QueryGroupForm'
	] ,
			  
	bibleId: '',
	bibleMapNode: null, 
			  
	initComponent: function() {
		var me = this ;
		
		if( me.bibleMapNode != null ) {
			
			var treeFields = [] ;
			var entryFields = [] ;
			
			var occur ;
			
			me.bibleMapNode.cascadeBy( function(node) {
				if( node === me.bibleMapNode ){
					return true ; // on skip le node parent/root (même instance que "me.bibleMapNode")
				}
				
				occur = {
					field_code: node.get('field_code'),
					field_text: node.get('field_text')
				};
				
				switch( node.get('field_linkbible_type') ) {
					case 'tree' :
						treeFields.push(occur) ;
						break ;
				
					case 'entry' :
						entryFields.push(occur) ;
						break ;
						
					default :
						break ;
				}
				
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
				title: 'Filter Bible Mode',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					name: 'group_bible_type',
					fieldLabel: 'Group by',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['mode','lib'],
						data : [
							{mode:'TREE', lib:'Treenode'},
							{mode:'ENTRY', lib:'Entry'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'mode'
				},{
					xtype:'numberfield',
					//width:60 ,
					hidden: true,
					minValue: 0,
					maxValue: 10,
					allowDecimals: false,
					fieldLabel: 'Tree depth',
					name:'group_bible_tree_depth'
				}]
			},{
				xtype: 'fieldset',
				hidden: true,
				hiddenMid: 'TREE' ,
				title: 'Display Tree Fields',
				defaultType: 'textfield',
				defaults: {anchor: '100%'},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					name: 'group_bible_display_treenode',
					forceSelection: true,
					editable: false,
					multiSelect: true,
					store: {
						fields: ['field_code','field_text'],
						data : treeFields
					},
					queryMode: 'local',
					displayField: 'field_text',
					valueField: 'field_code',
					valueField: 'field_code'
				}]
			}, {
				xtype: 'fieldset',
				hidden: true,
				hiddenMid: 'ENTRY' ,
				title: 'Display Entry Fields',
				defaultType: 'textfield',
				defaults: {anchor: '100%'},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					name: 'group_bible_display_entry',
					forceSelection: true,
					editable: false,
					multiSelect: true,
					store: {
						fields: ['field_code','field_text'],
						data : entryFields
					},
					queryMode: 'local',
					displayField: 'field_text',
					valueField: 'field_code'
				}]
			}, {
				xtype: 'fieldset',
				hidden: true,
				hiddenMid: 'ENTRYSSSS' ,
				title: 'Display Entry Fields',
				defaultType: 'textfield',
				defaults: {anchor: '100%'},
				layout: 'anchor',
				items: []
			}]
		}) ;
		
		
		
		this.callParent() ;
	},
	calcLayout: function(){
		var me = this ;
		
		var curSelect = me.getValues()['group_bible_type'] ;
		
		me.query('>fieldset')[0].query('>numberfield')[0].setVisible( curSelect === 'TREE' ) ;
		
		Ext.Array.each( me.query('>fieldset') , function(f){
			if( typeof f.hiddenMid !== 'undefined' ) {
				f.setVisible( curSelect == f.hiddenMid ) ;
			}
		},me) ;
	}
}) ;