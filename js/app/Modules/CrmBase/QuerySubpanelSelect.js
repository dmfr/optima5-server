Ext.define('QuerySelectFormulasymbolModel', {
	extend: 'Ext.data.Model',
	belongsTo: 'QuerySelectModel',
	fields: [
		{name: 'sequence',  type: 'int'},
		{name: 'math_operation',   type: 'string'},
		{name: 'math_parenthese_in',   type: 'boolean'},
		{name: 'math_fieldoperand',   type: 'string'},
		{name: 'math_staticvalue',   type: 'numeric'},
		{name: 'math_parenthese_out',   type: 'boolean'}
	]
});
Ext.define('QuerySelectModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'select_lib',  type: 'string'},
		{name: 'math_func_mode', type: 'string'},
		{name: 'math_func_group', type: 'string'},
		{name: 'math_round', type: 'numeric'}
	],
	validations: [
		{type: 'length',    field: 'select_lib',     min: 1},
	],
	hasMany: { 
		model: 'QuerySelectFormulasymbolModel',
		name: 'math_expression',
		associationKey: 'math_expression'
	}
});


Ext.define('Optima5.Modules.CrmBase.QuerySubpanelSelect' ,{
	extend: 'Optima5.Modules.CrmBase.QuerySubpanel',
			  
	alias: 'widget.op5crmbasequeryselect',
			  
	selectFields : [] ,
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply( me, {
			title: 'Math / Count results' ,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			autoDestroy: true ,
			items: [ Ext.apply(me.initComponentCreateGrid(),{
				flex:1 
			}),Ext.apply(me.initComponentCreateFormulaPanel(),{
				flex:1 
			})]
		}) ;
		
		me.callParent() ;
		
		me.setFormulaRecord(null) ;
	},
	initComponentCreateGrid: function() {
		var me = this ;
		
		var store = Ext.create('Ext.data.Store',{
			autoLoad: true,
			autoSync: true,
			model: 'QuerySelectModel',
			data : me.selectFields,
			proxy: {
				type: 'memory' ,
				reader: {
						type: 'json'
				},
				writer: {
					type:'json',
					writeAllFields: true
				}
			}
		}) ;
		
		var rowEditing = Ext.create('Ext.grid.plugin.RowEditing') ;
		rowEditing.on('canceledit', function() {
			var records = store.getRange();
			for (var i = 0; i < records.length; i++) {
				if( records[i].validate().getCount() > 0 )
					store.remove(records[i]) ;
			}
		},me) ;
		
		
		var grid = Ext.create('Ext.grid.Panel',{
			plugins: [rowEditing],
			store: store ,
			sortableColumns: false ,
			columns: [
				{ menuDisabled: true , header: 'Field Code',  dataIndex: 'select_lib' , flex:1, editor:{xtype:'textfield'}  }
			],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'left',
				items: [{
					iconCls: 'icon-add',
					handler: function(){
						var newRecordIndex = 0 ;
						
						store.insert(newRecordIndex, Ext.create('QuerySelectModel'));
						grid.getView().getSelectionModel().select(newRecordIndex) ;
						rowEditing.startEdit(newRecordIndex, 0);
					},
					scope: me
				}, '-', {
					itemId: 'delete',
					iconCls: 'icon-delete',
					disabled: true,
					handler: function(){
						var selection = grid.getView().getSelectionModel().getSelection()[0];
						if (selection) {
							store.remove(selection);
						}
					},
					scope: me
				}]
			}]
		}) ;
		
		grid.getSelectionModel().on('selectionchange', function(selModel, selections){
			grid.down('#delete').setDisabled(selections.length === 0);
			me.setFormulaRecord( selections[0] ) ;
		},me);
		
		return grid ;
	},
	initComponentCreateFormulaPanel: function(){
		var me = this ;
		
		me.formulapanel = Ext.create('Ext.panel.Panel',{
			layout:'fit',
			border:false
		}) ;
		
		return me.formulapanel ;
	},
			  
			  
	
	setFormulaRecord: function( editedrecord ){
		var me = this ;
		me.formulapanel.removeAll() ;
		if( typeof editedrecord === 'undefined' || editedrecord === null ) {
			me.formulapanel.add({
				xtype:'panel',
				border:false,
				frame:true
			});
			return ;
		}
		
		var formulaStore = editedrecord.math_expression() ;
		
		var formulaGrid = Ext.create('Ext.grid.Panel',{
			sortableColumns: false ,
			plugins: [Ext.create('Ext.grid.plugin.RowEditing')] ,
			store : formulaStore ,
			columns: [{
				menuDisabled: true ,
				header: 'Math' ,
				dataIndex: 'math_operation',
				width: 40 ,
				editor : {
					xtype: 'combobox',
					name: 'condition_bible_mode',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['math_operation','lib'],
						data : [
							{math_operation:'', lib:'no'},
							{math_operation:'+', lib:'+'},
							{math_operation:'-', lib:'-'},
							{math_operation:'*', lib:'X'},
							{math_operation:'/', lib:'/'},
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'math_operation'
				},
				renderer: function( value ) {
					if( value != null && value.length > 0 ) {
						return '<b>'+value+'</b>' ;
					}
					return '' ;
				}
			},{
				menuDisabled: true ,
				header: '[<b>(</b>]' ,
				dataIndex: 'math_parenthese_in',
				width:24,
				editor:{
					xtype:'checkbox'
				},
				renderer: function( value ) {
					if( value === true ) {
						return '<b>(</b>' ;
					}
					return '' ;
				}
			},{
				menuDisabled: true ,
				header: 'Field/Value' ,
				dataIndex: 'math_fieldoperand',
				flex:1 ,
				renderer: function( value, metaData, record ) {
					if( record.get('math_staticvalue') > 0 ) {
						return 'STATIC(<u>'+record.get('math_staticvalue')+'</u>)' ;
					}
					
					
					var treeRecord ;
					if( treeRecord = me.getQueryPanel().getQueryPanelTreeStore().getNodeById(value) ) {
						switch( treeRecord.get('field_type') ) {
							case 'file' :
							case 'link' :
								return 'COUNT('+treeRecord.get('field_text')+')' ;
						
							default :
								return treeRecord.get('field_text_full')
						}
					}
					return value ;
				}
			},{
				menuDisabled: true ,
				header: '[<b>)</b>]' ,
				dataIndex: 'math_parenthese_out',
				width:24,
				editor:{
					xtype:'checkbox'
				},
				renderer: function( value ) {
					if( value === true ) {
						return '<b>)</b>' ;
					}
					return '' ;
				}
			}],
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: [{
					xtype: 'combobox',
					name: 'math_func_mode',
					width: 60,
					value: editedrecord.get('math_func_mode'),
					forceSelection: true,
					editable: false,
					store: {
						fields: ['math_func_mode','lib'],
						data : [
							{math_func_mode:'OUT', lib:'outer'},
							{math_func_mode:'IN', lib:'inner'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'math_func_mode',
					listeners: {
						change: function( mcombo, newValue ) {
							editedrecord.set('math_func_mode',newValue) ;
						},
						scope:me
					}
				},{
					xtype: 'combobox',
					name: 'math_func_group',
					width: 60,
					value: editedrecord.get('math_func_group'),
					forceSelection: true,
					editable: false,
					store: {
						fields: ['math_func_group','lib'],
						data : [
							{math_func_group:'AVG', lib:'AVG'},
							{math_func_group:'SUM', lib:'SUM'},
							{math_func_group:'MIN', lib:'MIN'},
							{math_func_group:'MAX', lib:'MAX'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'math_func_group',
					listeners: {
						change: function( mcombo, newValue ) {
							editedrecord.set('math_func_group',newValue) ;
						},
						scope:me
					}
				},{
					xtype:'label',
					width:10
				},{
					xtype:'label',
					text: 'R/d: '
				},{
					xtype: 'numberfield',
					name: 'math_round',
					width:35,
					value: editedrecord.get('math_round'),
					valueField: 'math_round',
					listeners: {
						change: function( mcombo, newValue ) {
							editedrecord.set('math_round',newValue) ;
						},
						scope:me
					}
				},'->',{
					itemId: 'addStatic',
					iconCls: 'icon-add',
					menu: {
						xtype:'menu' ,
						title: 'User options',
						items:[{
							xtype:'textfield' ,
							allowBlank: false,
							regex: /^[0-9]\d*(\.\d+)?$/ ,
							width:50
						},{
							xtype:'button',
							text:'Add value',
							handler: function(button){
								var textfield = button.up().query('textfield')[0] ;
								if( textfield.isValid() ) {
									var newRecord = Ext.create('QuerySelectFormulasymbolModel',{
										math_staticvalue:textfield.getValue()
									}) ;
									formulaGrid.getStore().insert( formulaGrid.getStore().count(), newRecord );
									
									Ext.menu.Manager.hideAll();
								}
							},
							scope:me
						}]
					}
				},{
					itemId: 'delete',
					iconCls: 'icon-delete',
					disabled: true,
					handler: function(){
						var selection = formulaGrid.getView().getSelectionModel().getSelection()[0];
						if (selection) {
							formulaStore.remove(selection);
						}
					},
					scope: me
					
				}]
			}],
			listeners: {
				render: me.setFormulaRecordOnGridRender,
				scope: me
			},
			viewConfig: {
					listeners: {
						drop: function(){
						},
						scope: me
					},
					plugins: {
						ptype: 'gridviewdragdrop',
						ddGroup: 'queryselectreorder'+me.getParentId()
					}
			}
		}) ;
		formulaGrid.getSelectionModel().on('selectionchange', function(selModel, selections){
			formulaGrid.down('#delete').setDisabled(selections.length === 0);
		},me);
		
		me.formulapanel.add(formulaGrid) ;
	},
	setFormulaRecordOnGridRender: function(grid) {
		var me = this ;
		
		var gridPanelDropTargetEl =  grid.body.dom;

		var gridPanelDropTarget = Ext.create('Ext.dd.DropTarget', gridPanelDropTargetEl, {
			ddGroup: 'TreeToGrids'+me.getParentId(),
			notifyEnter: function(ddSource, e, data) {
					//Add some flare to invite drop.
					grid.body.stopAnimation();
					grid.body.highlight();
			},
			notifyDrop: function(ddSource, e, data){
					// Reference the record (single selection) for readability
					var selectedRecord = ddSource.dragData.records[0];
					
					switch( selectedRecord.get('field_type') ) {
						case 'file' :
						case 'link' :
						case 'join' :
						case 'date' :
						case 'number' :
							break ;
						
						default :
							return false ;
					}
					
					var newRecord = Ext.create('QuerySelectFormulasymbolModel',{
						math_fieldoperand:selectedRecord.get('field_code')
					}) ;
					
					
					
					grid.getStore().insert( grid.getStore().count(), newRecord );

					/*
					// Load the record into the form
					formPanel.getForm().loadRecord(selectedRecord);
					// Delete record from the source store.  not really required.
					ddSource.view.store.remove(selectedRecord);
					*/
					return true;
			}
		});
	},

	syncGrid: function() {
		
	}
			  
			  
}) ;